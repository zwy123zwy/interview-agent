# Server Structure

当前后端代码统一放在 `src/server`。

目录说明：

- `application/`：分析流程编排、用例服务
- `domain/`：领域对象、契约、评分规则
- `infrastructure/`：LLM、日志、文件、数据库
- `interfaces/`：API Route、DTO、适配器

当前阶段仅建立结构，不接数据库。
