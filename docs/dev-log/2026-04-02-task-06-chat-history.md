# 2026-04-02 Task 06 Chat History

## 日期

- 2026-04-02

## 任务目标

- 增加对话历史查询接口
- 支持前端读取和切换已有对话
- 修正聊天页中的乱码文案

## 修改模块

- 对话存储
- 聊天历史 API
- 前端历史会话侧栏
- 文案修正

## 修改文件

- `src/server/infrastructure/store/conversation-store.ts`
- `src/app/api/chat/[conversationId]/route.ts`
- `src/app/api/chat/conversations/route.ts`
- `src/app/chat-page.tsx`
- `docs/dev-log/2026-04-02-task-06-chat-history.md`

## 结果说明

- 已支持查询单个会话详情
- 已支持查询历史会话列表
- 前端可刷新并切换已有会话
- 聊天页面中的中文文案已重新清理

## 下一步计划

- 将 tool / skill 判断部分接入模型输出
- 将聊天请求真正路由到 resume / jd / report 流程
