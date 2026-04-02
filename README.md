# Interview Agent

程序员面试平台 MVP 工程仓库。

当前技术栈：

- Next.js 16
- TypeScript
- App Router
- Tailwind CSS 4

当前初始化状态：

- 已完成 Git 仓库初始化
- 已完成 Next.js 基础工程初始化
- 已保留产品设计文档与技术方案文档
- 后续将继续接入 TypeORM、业务模块和 LLM 配置

## 目录说明

- `src/app`：前端页面与路由
- `docs/dev-log`：按日期记录的开发日志
- `mvp_product_design_llm.md`：产品设计方案
- `technical_design.md`：技术方案原始文档

## 启动方式

```bash
pnpm dev
```

访问 `http://localhost:3000`

## 工程约定

- 按任务分阶段实现
- 每完成一个任务，补一份日志文档
- 日志文档需记录日期、任务目标、修改模块、变更文件、后续任务
- 当前阶段代码由你决定何时推送远端
