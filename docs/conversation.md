# 对话模块

## 设计目标

- 对话归属完全由数据库外键（`conversations.userId`）决定
- conversationId 是纯随机 ID，不编码任何用户信息
- 用户只能读写自己的对话（服务端强制过滤）

## 数据模型

```
users
  userId      PK varchar(64)
  passwordHash
  createdAt

conversations
  conversationId  PK varchar(64)   — 格式: conv_xxxxxxxx
  userId          FK → users.userId  ON DELETE CASCADE  NULLABLE
  createdAt
  updatedAt

messages
  id              PK varchar(64)   — 格式: msg_xxxxxxxx
  conversationId  FK → conversations.conversationId  ON DELETE CASCADE
  role            varchar(20)      — 'user' | 'assistant' | 'system'
  content         text
  createdAt
```

`userId` 在 `conversations` 上允许 NULL，保留历史兼容性（旧前缀格式数据）。新建对话始终写入 userId。

## 文件结构

```
src/server/
  domain/chat.ts                    — ChatMessage / ChatConversation / ChatRequest
  infrastructure/
    store/conversation-store.ts     — DB 读写（所有函数 async）
    database/entities/
      conversation.entity.ts
      message.entity.ts
  application/chat-orchestrator.ts  — prepareChatTurn / finalizeAssistantTurn
src/app/api/chat/
  route.ts                          — POST /api/chat（发消息 + 流式回复）
  conversations/route.ts            — GET /api/chat/conversations（列表）
  [conversationId]/route.ts         — GET /api/chat/:id（单条）
```

## API

### POST /api/chat

发送消息，流式返回 AI 回复。

**请求**（需要 session cookie）：
```json
{
  "message": "你好",
  "conversationId": "conv_abc123"   // 可选，不传则新建对话
}
```

**响应**：NDJSON 流，每行一个 JSON 事件：

```jsonl
{"type":"meta","conversationId":"conv_abc123","replyId":"msg_xyz","toolDecisions":[...],"skillDecisions":[...],"contextHints":[...],"llm":{"provider":"ollama","model":"..."}}
{"type":"chunk","content":"你好"}
{"type":"chunk","content":"，有什么可以帮你？"}
{"type":"done","streamed":true}
```

### GET /api/chat/conversations

返回当前用户的对话列表，按 `updatedAt` 降序。

**响应**：
```json
{
  "items": [
    {
      "conversationId": "conv_abc123",
      "updatedAt": "2026-04-02T10:00:00.000Z",
      "preview": "最后一条消息内容（截断）",
      "messageCount": 4
    }
  ]
}
```

### GET /api/chat/:conversationId

返回单条对话的完整消息列表。如果对话不属于当前用户返回 404。

## conversation-store 函数

| 函数 | 说明 |
|---|---|
| `getConversation(id)` | 按 ID 查询，不做用户过滤（内部使用） |
| `getConversationForUser(userId, id)` | 按 ID + userId 查询，归属不符返回 null |
| `listConversations(userId)` | 查询某用户全部对话，按时间倒序 |
| `saveConversation(userId, conversation)` | 新建对话并写入 userId 外键 |
| `appendConversationMessage(id, message)` | 追加消息，同时更新 updatedAt |

## 对话生命周期

```
用户发消息
  ↓
prepareChatTurn(request)
  → 若无 conversationId → createId("conv") 生成新 ID
  → getConversationForUser() 检查是否存在
  → 若不存在 → saveConversation()（写 userId 外键）
  → appendConversationMessage() 追加用户消息
  ↓
streamChatCompletion() 流式输出
  ↓
finalizeAssistantTurn()
  → appendConversationMessage() 追加 assistant 消息
```

## 已废弃

`src/server/domain/conversation-scope.ts`（`conversationPrefix` / `belongsToUser`）中的前缀机制已废弃，不再被任何代码引用。该文件可在后续清理时删除。
