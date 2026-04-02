# Interview Agent

程序员面试平台 MVP 仓库。

当前采用单项目结构：

- 一个 Next.js 工程
- 一套依赖
- 前端页面与后端逻辑在同一仓库中按职责分层

## 目录结构

- `src/app`：页面路由与 UI 入口
- `src/server`：后端能力分层
- `docs`：开发日志与架构说明
- `public`：静态资源
- `mvp_product_design_llm.md`：产品设计方案
- `technical_design.md`：原始技术方案

## `src/server` 说明

- `src/server/application`：用例编排、任务流程
- `src/server/domain`：领域模型、规则、契约
- `src/server/infrastructure`：LLM、存储、日志、后续数据库
- `src/server/interfaces`：API 路由、DTO、适配层

## 数据库接入时机

当前阶段不接数据库。

数据库应该在后端业务模型稳定后再接入，主要用于：

- 保存分析会话 `session`
- 保存简历/JD 结构化结果
- 保存匹配报告 `report`
- 保存任务状态与错误信息

因此，数据库属于 `src/server/infrastructure` 范围，不属于初始化阶段的首要任务。

## 启动方式

```bash
pnpm dev
```

## 工程约定

- 每完成一个任务，生成对应日志文档
- 日志记录日期、目标、修改模块、修改文件、结果和下一步
- 后端代码统一进入 `src/server`
