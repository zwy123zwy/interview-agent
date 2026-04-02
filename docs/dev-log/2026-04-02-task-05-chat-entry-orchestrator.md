# 2026-04-02 Task 05 Chat Entry Orchestrator

## 日期

- 2026-04-02

## 任务目标

- 将产品入口切换为前端聊天页
- 建立 `/api/chat` 路由
- 增加意图判断、tool/skill 选择和上下文补充的后端编排层

## 修改模块

- 聊天领域模型
- 对话上下文存储
- tool / skill 注册表
- 聊天编排器
- 聊天 API
- 前端聊天页

## 修改文件

- `src/server/domain/chat.ts`
- `src/server/infrastructure/store/conversation-store.ts`
- `src/server/infrastructure/agent/tool-registry.ts`
- `src/server/infrastructure/agent/skill-registry.ts`
- `src/server/application/chat-context-service.ts`
- `src/server/application/chat-orchestrator.ts`
- `src/app/api/chat/route.ts`
- `src/app/chat-page.tsx`
- `src/app/page.tsx`
- `docs/dev-log/2026-04-02-task-05-chat-entry-orchestrator.md`

## 结果说明

- 前端首页已改为文字请求与对话入口
- 后端已能根据消息做基础意图判断
- 后端已能返回 tool decisions、skill decisions、context hints
- 当前实现已改为流式返回，前端会边接收边渲染回复
- 页面已改为单列对话布局，消息左右对齐，气泡宽度更稳定
- 当前已补统一 LLM provider 抽象，默认优先本地 Ollama
- 当本地 Ollama 或其他已配置 provider 可用时，`/api/chat` 会优先走真实流式
- 若 provider 不可用，则自动回退到占位编排回复
- 当前已将对话历史一并传给 provider，不再只传当前一条消息
- 前端已显示当前 provider / model 与真实流式或回退流式状态

## 下一步计划

- 补对话历史查询
- 接入真实 LLM 回复
- 将具体能力路由到 resume / JD / report 流程
