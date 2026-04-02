# Project Structure

## 当前结构

项目采用单工程分层，不拆成独立的 `frontend` / `backend` 两套应用。

```text
src/
  app/
  server/
    application/
    domain/
    infrastructure/
    interfaces/
docs/
public/
```

## 分层职责

### `src/app`

负责：

- 页面路由
- 页面布局
- 交互入口
- 报告展示 UI

### `src/server/application`

负责：

- 用例编排
- 分析任务流程
- session 级流程控制

### `src/server/domain`

负责：

- 领域对象
- 数据契约
- 评分规则

### `src/server/infrastructure`

负责：

- LLM Provider 封装
- 文件存储
- 日志能力
- 后续数据库接入

### `src/server/interfaces`

负责：

- API Route 适配
- DTO
- 请求响应转换

## 为什么不拆双工程

当前技术选型是 `Next.js + TypeScript`，现阶段更适合：

- 一套依赖
- 一套运行方式
- 一套部署入口

如果现在强拆为 `frontend` 和 `backend`，会增加工程复杂度，但并不会带来实际收益。

## 数据库的合理接入点

当这些模型稳定后再引入数据库和 ORM：

- `Session`
- `CandidateProfile`
- `JobSpec`
- `MatchReport`
- `ErrorInfo`

数据库位置建议放在：

- `src/server/infrastructure/db`
