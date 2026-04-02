# 2026-04-02 Task 02 Structure Correction

## 日期

- 2026-04-02

## 任务目标

- 修正错误的前后端双工程拆分
- 调整为单项目分层结构
- 明确后端代码统一放入 `src/server`

## 修改模块

- 仓库目录结构
- 架构说明文档
- 根级 README
- 开发日志

## 修改文件

- `README.md`
- `docs/architecture/project-structure.md`
- `docs/dev-log/2026-04-02-task-01-project-init.md`
- `docs/dev-log/2026-04-02-task-02-structure-correction.md`

## 结果说明

- Next.js 工程已恢复到仓库根目录
- 后端骨架改为 `src/server/*`
- 前后端不再拆为两套独立依赖
- 数据库接入位置明确为 `src/server/infrastructure/db`

## 遗留说明

- 上一步错误创建的 `frontend/` 和 `backend/` 残留目录删除时遭遇 Windows 下 `pnpm` 软链接目录权限问题
- 这些残留目录不参与主工程结构，后续可继续清理

## 下一步计划

- 补 `src/server` 下的模块占位说明
- 明确 API、LLM、数据契约的落点
