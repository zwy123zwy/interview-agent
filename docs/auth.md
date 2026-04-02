# 认证模块

## 设计目标

- 服务端持有身份凭证，客户端不存储 userId
- 所有受保护 API 从 Cookie 读取 session，拒绝 body/query 里的 userId 参数
- Token 用 HMAC-SHA256 签名防篡改，无需数据库存储 session

## 文件结构

```
src/server/
  domain/auth/
    auth-types.ts          — LoginPayload / RegisterPayload / AuthErrorCode
    user-identity.ts       — normalizeUserId / isValidUserId
  application/auth/
    login-user.ts          — 登录用例：验证凭据 → 返回 { ok, userId }
    register-user.ts       — 注册用例：校验邀请码 → 写库
  infrastructure/auth/
    password-hasher.ts     — scrypt 哈希 / 验证
    user-repository.ts     — findUserById / insertUser (TypeORM)
    session-token.ts       — createSessionToken / verifySessionToken
    session-reader.ts      — getSessionUserId()：从当前请求 Cookie 读 userId
    registration-code-store.ts — 从 REGISTRATION_CODES 环境变量读取邀请码
  interfaces/auth/
    login-route-handler.ts  — 处理 POST /api/auth/login
    register-route-handler.ts
src/app/api/auth/
  login/route.ts
  register/route.ts
  logout/route.ts          — POST：清除 Cookie
```

## 认证流程

### 注册

```
POST /api/auth/register
  { userId, password, registrationCode }
    → registerUser()
      → isRegistrationCodeValid()   // 环境变量 REGISTRATION_CODES
      → findUserById()              // 检查重名
      → hashPassword()              // scrypt
      → insertUser()
    ← 201 { ok: true }
```

`REGISTRATION_CODES` 是逗号分隔的字符串，例如 `REGISTRATION_CODES=abc123,xyz456`。如果未设置，注册接口始终返回 403。

### 登录

```
POST /api/auth/login
  { userId, password }
    → loginUser()
      → findUserById()
      → verifyPassword()           // timingSafeEqual
    → createSessionToken(userId)   // HMAC-SHA256 签名
    ← Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Max-Age=604800
    ← { ok: true }
```

### 退出

```
POST /api/auth/logout
  ← Set-Cookie: session=; Max-Age=0
  ← { ok: true }
```

## Session Token 格式

```
{userId}:{nonce}:{HMAC-SHA256(userId:nonce, SESSION_SECRET)}
```

- `nonce`：32 字节随机数，Base64URL 编码
- 签名用 `crypto.timingSafeEqual` 验证，防时序攻击
- `SESSION_SECRET` 环境变量；开发环境有硬编码 fallback，**生产必须覆盖**

## 在 Route Handler 中读取用户身份

```ts
import { getSessionUserId } from "@/server/infrastructure/auth/session-reader";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error_code: "UNAUTHORIZED" }, { status: 401 });
  }
  // ...
}
```

`getSessionUserId()` 内部调用 Next.js `cookies()`（async），只能在 Route Handler 或 Server Action 中使用。

## Cookie 属性

| 属性 | 值 | 说明 |
|---|---|---|
| `HttpOnly` | true | JS 不可读，防 XSS |
| `SameSite` | Lax | 防 CSRF，允许顶级导航携带 |
| `Secure` | 生产为 true | 仅 HTTPS 传输 |
| `Max-Age` | 604800（7天） | 到期自动失效 |

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `SESSION_SECRET` | 生产必填 | HMAC 签名密钥，建议 32+ 字节随机串 |
| `REGISTRATION_CODES` | 必填 | 逗号分隔的邀请码列表 |
