# 程序员面试平台（MVP）产品设计文档（LLM 可理解版）

> 目标：把“第一版（MVP）”定义成一份**可被大模型直接理解并据此生成实现/测试/提示词**的规格文档。  
> MVP 范围：**简历解析 + JD 匹配 + 报告展示**。不包含多轮面试录入/汇总。

---

## 0. 一句话定义（MVP）

用户上传一份简历与一段 JD，系统在一次会话中生成结构化的候选人画像、岗位需求结构化结果，并输出一份可解释的匹配报告（含分数、维度明细、差距与面试问题建议）。

---

## 1. 范围与非目标

### 1.1 MVP 范围（必须做）

- **简历解析**：从简历文件/文本中抽取候选人结构化画像 `CandidateProfile`。
- **JD 解析**：从 JD 文本中抽取结构化岗位需求 `JobSpec`。
- **匹配与报告**：基于 `CandidateProfile` 与 `JobSpec` 产出 `MatchReport`（可解释）。
- **基本前后端展示**：上传、发起分析、展示报告。
- **持久化（最小）**：保存输入快照与最终报告，支持刷新后可重新查看。

### 1.2 非目标（MVP 不做）

- 多轮面试反馈录入/聚合/雷达图（后续版本）。
- 全量向量检索与复杂重排（可留接口，MVP 用规则/简单相似度）。
- 复杂权限系统、多租户计费、企业级审计（MVP 只做最小鉴权/隔离）。
- 端到端“通用 Agent 平台”能力（MVP 采用**固定流水线**，不要求模型自由选择工具链）。

---

## 2. 角色与使用场景

### 2.1 角色（Personas）

- **HR**：希望快速判断候选人与岗位匹配度，获得面试关注点。
- **用人经理**：关注候选人技术栈与关键项目经验是否覆盖岗位核心需求。

### 2.2 典型用户故事（User Stories）

1. **上传并分析**：作为 HR，我上传简历与 JD，点击“开始分析”，得到匹配报告。
2. **可解释**：作为 HR，我希望看到总分+维度分+理由，知道为什么给这个分。
3. **面试问题建议**：作为面试官，我希望得到“针对差距/关键技能”的追问问题。
4. **可复现**：作为 HR，我希望刷新页面后仍能看到同一次分析结果（基于 session/report id）。

---

## 3. 术语

- **Session（会话）**：一次分析流程的容器，包含输入、运行状态、结果与错误。
- **MVP Pipeline（固定流水线）**：解析简历 → 解析 JD → 匹配打分 → 生成报告。
- **LLM（大模型）**：用于结构化抽取与解释生成。
- **结构化输出**：LLM 输出必须符合本文给定的 JSON Schema（或等价约束）。

---

## 4. 产品流程（用户视角）

### 4.1 页面与交互（最小）

1. 上传区：上传简历（文件）+ 输入/粘贴 JD（文本）。
2. 按钮：`开始分析`。
3. 结果区：展示
   - 候选人画像摘要（技能、年限、亮点）
   - JD 需求摘要（必备/加分）
   - 匹配总分与维度明细
   - 差距点与建议
   - 建议面试问题列表

### 4.2 状态机（前端/后端通用）

`CREATED -> UPLOADED -> RUNNING -> SUCCEEDED | FAILED | CANCELLED`

- `CREATED`：会话已创建但未上传。
- `UPLOADED`：输入已就绪（简历 asset + JD 文本）。
- `RUNNING`：后端在执行流水线。
- `SUCCEEDED`：产生 `MatchReport` 并可展示。
- `FAILED`：失败，包含结构化错误 `ErrorInfo`。
- `CANCELLED`：用户取消（MVP 可不提供按钮，但状态保留）。

---

## 5. 数据契约（LLM/系统都必须遵循）

> 说明：以下 JSON 结构用于数据库模型、接口返回、以及 LLM 的结构化输出约束。  
> 约束原则：字段可选要明确；数组要给出最大建议长度；所有分数定义 0-100 或 0-1；避免含糊字段。

### 5.1 `CandidateProfile`（候选人画像）

```json
{
  "candidate_id": "cand_123",
  "source": {
    "resume_asset_id": "asset_abc",
    "resume_sha256": "optional_hash",
    "language": "zh"
  },
  "basic": {
    "name": "张三",
    "email": "optional",
    "phone": "optional",
    "location": "optional"
  },
  "summary": {
    "title_guess": "后端开发工程师",
    "years_total": 5,
    "strengths": ["分布式系统", "Java生态", "性能优化"],
    "risks": ["缺少K8s实战", "大规模数据平台经验不明确"]
  },
  "skills": [
    { "name": "Java", "level": "advanced", "years": 4, "evidence": ["项目A使用Spring Boot"], "confidence": 0.82 }
  ],
  "experience": [
    {
      "company": "某公司",
      "role": "后端工程师",
      "start": "2021-01",
      "end": "2024-06",
      "highlights": ["负责订单系统重构", "将接口延迟降低30%"],
      "tech": ["Spring Boot", "MySQL", "Redis"]
    }
  ],
  "projects": [
    {
      "name": "订单系统",
      "context": "电商",
      "responsibilities": ["架构设计", "性能优化"],
      "tech": ["Java", "Redis"],
      "results": ["QPS提升2倍"],
      "confidence": 0.7
    }
  ],
  "education": [
    { "school": "某大学", "degree": "本科", "major": "计算机", "graduation_year": 2020 }
  ]
}
```

**约束**：
- `skills[].level ∈ {beginner, intermediate, advanced, expert}`  
- `confidence ∈ [0,1]`  
- `strengths/risks` 建议各 ≤ 5 条  

### 5.2 `JobSpec`（岗位需求结构化）

```json
{
  "job_id": "job_456",
  "source": { "jd_text_sha256": "optional_hash", "language": "zh" },
  "title": "后端工程师",
  "seniority": "mid",
  "must_have": [
    { "name": "Java", "weight": 0.25, "requirements": ["熟悉JVM", "Spring生态"], "evidence_hint": ["项目经历", "性能优化案例"] }
  ],
  "nice_to_have": [
    { "name": "Kubernetes", "weight": 0.1, "requirements": ["容器化部署经验"] }
  ],
  "responsibilities": ["负责核心服务开发", "参与架构演进"],
  "interview_focus": ["高并发场景设计", "数据库索引与事务", "缓存一致性"]
}
```

**约束**：
- `weight ∈ (0,1]`，同一列表内权重可不归一化，但必须可解释。
- `seniority ∈ {junior, mid, senior, lead}`。

### 5.3 `MatchReport`（匹配报告）

```json
{
  "report_id": "rep_789",
  "session_id": "sess_001",
  "candidate_id": "cand_123",
  "job_id": "job_456",
  "score_total": 78,
  "score_breakdown": [
    { "dimension": "skills", "score": 82, "reason": "Java/Spring经历充分，但K8s证据不足" },
    { "dimension": "experience", "score": 75, "reason": "年限匹配，中大型系统规模信息缺失" },
    { "dimension": "projects", "score": 80, "reason": "有性能优化成果，但缺少监控体系描述" }
  ],
  "strengths": [
    { "point": "Java生态扎实", "evidence": ["Spring Boot项目", "性能优化结果"] }
  ],
  "gaps": [
    { "point": "Kubernetes经验不足", "impact": "部署与运维协同成本", "suggestion": "追问容器化/CI-CD经历" }
  ],
  "suggested_questions": [
    { "topic": "缓存一致性", "question": "如何处理缓存与数据库一致性？给出你做过的方案。", "why": "岗位关注高并发与一致性" }
  ],
  "assumptions": [
    "简历未体现K8s不等于不会，建议面试确认"
  ],
  "created_at": "2026-04-02T12:00:00Z",
  "model_trace": {
    "llm_provider": "anthropic|openai|other",
    "llm_model": "model-name",
    "prompt_version": "v1"
  }
}
```

**约束**：
- `score_total` 与各维度 `score` 均为 0-100 整数。
- `score_breakdown[].dimension ∈ {skills, experience, projects, education, other}`（MVP 至少前三项）。
- `suggested_questions` 建议 5-12 条。

### 5.4 `ErrorInfo`（结构化错误）

```json
{
  "error_code": "RESUME_PARSE_FAILED",
  "message": "无法从简历中提取文本内容",
  "retryable": false,
  "details": { "hint": "请上传可复制文本的PDF或DOCX" }
}
```

---

## 6. 后端 API 契约（MVP）

> 注意：以下是“产品级契约”，实现时可用 REST；如做流式展示，可额外提供 SSE。

### 6.1 创建会话

- `POST /api/sessions`
- Request:

```json
{ "client_request_id": "optional-idempotency" }
```

- Response:

```json
{ "session_id": "sess_001", "status": "CREATED" }
```

### 6.2 上传简历（最小）

- `POST /api/sessions/{session_id}/resume`
- Multipart：`file`
- Response:

```json
{ "resume_asset_id": "asset_abc", "status": "UPLOADED" }
```

### 6.3 提交 JD 文本

- `POST /api/sessions/{session_id}/jd`
- Request:

```json
{ "jd_text": "..." }
```

- Response:

```json
{ "job_id": "job_456", "status": "UPLOADED" }
```

### 6.4 开始分析（固定流水线）

- `POST /api/sessions/{session_id}/run`
- Request:

```json
{ "mode": "mvp_pipeline_v1" }
```

- Response（同步返回最终报告或返回 job_id，二选一；MVP 推荐同步）：

```json
{ "status": "SUCCEEDED", "report": { "report_id": "rep_789", "score_total": 78 } }
```

### 6.5 查询会话

- `GET /api/sessions/{session_id}`
- Response:

```json
{
  "session_id": "sess_001",
  "status": "SUCCEEDED",
  "resume_asset_id": "asset_abc",
  "job_id": "job_456",
  "report_id": "rep_789",
  "error": null
}
```

### 6.6 获取报告

- `GET /api/reports/{report_id}`
- Response：完整 `MatchReport`

---

## 7. LLM 交互规范（让模型“读得懂/做得对”）

### 7.1 系统提示词（System Prompt）约束（产品级）

1. 输出必须是**严格 JSON**，且符合对应 Schema（`CandidateProfile` / `JobSpec` / `MatchReport`）。
2. 不能编造不存在的事实；若简历缺信息，写入 `assumptions` 或在 `gaps` 标注“证据缺失”。
3. 必须提供 `evidence`（证据片段/归因）与 `confidence`（在候选人画像中）。
4. 分数必须可解释：每个维度给 `reason`。

### 7.2 推荐的流水线提示词结构（实现参考）

**Step A：简历 → CandidateProfile**  
输入：简历纯文本 `resume_text`（MVP 先把“提取文本”当作系统能力，不要求模型做 OCR）。  
输出：`CandidateProfile` JSON。

**Step B：JD → JobSpec**  
输入：`jd_text`。  
输出：`JobSpec` JSON。

**Step C：CandidateProfile + JobSpec → MatchReport**  
输入：两个 JSON。  
输出：`MatchReport` JSON（包含总分、维度分、差距与面试问题）。

> MVP 不要求“工具调用”自由编排；后续版本再引入 tool-calling / agent loop。

---

## 8. MVP 验收标准（Acceptance Criteria）

### 8.1 功能验收

- 能上传简历 + 输入 JD，点击开始后拿到报告。
- 报告包含：`score_total`、至少 3 个维度 `score_breakdown`、至少 3 条 `gaps`、至少 5 条 `suggested_questions`。
- 缺失信息不编造：必须在 `assumptions` 或 `gaps` 显式说明“证据缺失”。
- 刷新后可通过 `session_id/report_id` 重新查看同一结果。

### 8.2 稳定性验收（最小）

- 简历解析失败可返回 `ErrorInfo`（含 `retryable`）。
- 同一 `client_request_id` 不产生重复会话（或至少不产生重复报告）。

---

## 9. 版本演进（为后续 agent loop/工具化留接口）

> 下版本（非 MVP）可以增加：SSE 流式进度事件、工具化执行器、异步队列、向量检索与重排、多轮面试反馈模块。  
> 但必须保持本版本的 `CandidateProfile` / `JobSpec` / `MatchReport` 兼容或可迁移。

---

## 10. 工程实现方案（草案）

> 目标：先完成一个可交付、可验证、可扩展的 MVP 工程版本；优先保证主流程跑通、结构化输出稳定、模型可配置，而不是一开始追求复杂编排。

### 10.1 实现原则

- **固定流水线优先**：先按 `简历文本提取 → CandidateProfile → JobSpec → MatchReport` 实现，避免过早引入 agent loop。
- **结构化约束优先**：所有 LLM 输出必须经过 Schema 校验，不符合即重试或报错。
- **大模型可配置**：Provider、Model、Prompt Version、温度、超时、重试策略均需可配置，不能写死在业务代码中。
- **最小可运维**：记录请求链路、模型调用参数、失败原因，便于复盘和替换模型。
- **先同步后异步**：MVP 优先同步接口完成分析；若单次耗时不可接受，再平滑切换异步任务队列。

### 10.2 建议技术架构

#### 前端

- Web 前端：React + Next.js 或 React + Vite。
- 页面范围：上传页、分析中状态页、报告展示页。
- 调用方式：通过 REST 调用后端接口，MVP 不强依赖 SSE。

#### 后端

- API 服务：Node.js + NestJS / Express，或 Python + FastAPI。
- 推荐优先：**FastAPI**，原因是结构化数据校验、LLM 编排、文档生成效率更高。
- 核心模块：
  - Session 模块：创建会话、状态流转、幂等处理。
  - Resume 模块：文件上传、文本提取、哈希计算。
  - JD 模块：JD 文本保存、结构化解析。
  - LLM 模块：统一封装模型调用、参数配置、重试与日志。
  - Report 模块：匹配打分、报告生成、持久化。

#### 存储

- 关系型数据库：PostgreSQL 或 MySQL，MVP 推荐 PostgreSQL。
- 对象存储：本地文件系统或 MinIO，用于保存简历原文件。
- 缓存：MVP 可不引入 Redis；若需要异步化或限流，再加入。

### 10.3 核心分层设计

#### 1. 接口层

- 对外提供 `/api/sessions`、`/resume`、`/jd`、`/run`、`/reports` 等接口。
- 只负责参数校验、鉴权、响应格式，不承载复杂业务逻辑。

#### 2. 应用服务层

- 编排固定流水线。
- 控制状态流转：`CREATED -> UPLOADED -> RUNNING -> SUCCEEDED/FAILED`。
- 统一处理失败重试、错误落库、幂等逻辑。

#### 3. 领域层

- 定义 `CandidateProfile`、`JobSpec`、`MatchReport`、`ErrorInfo` 的领域对象和校验规则。
- 定义匹配评分规则的基础算法，例如：
  - 必备技能覆盖率
  - 年限匹配度
  - 项目证据强度
  - 加分项命中度

#### 4. 基础设施层

- 文件上传与文本提取。
- 数据库存储。
- LLM Provider 适配器。
- 统一日志、监控、审计字段。

### 10.4 大模型可配置方案

#### 配置目标

- 支持切换不同大模型供应商，例如 OpenAI、Anthropic、Azure OpenAI、其他兼容 OpenAI API 的服务。
- 支持不同任务绑定不同模型，例如：
  - 简历解析模型
  - JD 解析模型
  - 报告生成模型
- 支持不同环境配置不同模型参数，例如开发环境低成本模型，生产环境高质量模型。

#### 配置项建议

```yaml
llm:
  provider: openai
  base_url: https://api.openai.com/v1
  api_key: ${LLM_API_KEY}
  timeout_ms: 30000
  max_retries: 2
  default_temperature: 0.2
  tasks:
    resume_parse:
      model: gpt-4.1-mini
      temperature: 0
      prompt_version: v1
    jd_parse:
      model: gpt-4.1-mini
      temperature: 0
      prompt_version: v1
    match_report:
      model: gpt-4.1
      temperature: 0.2
      prompt_version: v1
```

#### 工程要求

- 业务代码只能依赖统一 `LLMService` 接口，不能直接散落调用某家 SDK。
- 每次调用必须记录：
  - `provider`
  - `model`
  - `prompt_version`
  - `latency_ms`
  - `token_usage`
  - `request_id`
- Prompt 模板应版本化管理，例如 `prompts/resume_parse/v1.md`。
- 模型切换应通过配置文件或环境变量完成，不应修改业务逻辑。

### 10.5 推荐模块拆分

#### 模块一：文件与文本提取

- 支持 PDF / DOCX 上传。
- 先做文本型 PDF / DOCX 提取，不做 OCR。
- 输出统一 `resume_text`，供后续 LLM 流程使用。

#### 模块二：结构化解析

- `resume_text -> CandidateProfile`
- `jd_text -> JobSpec`
- 输出后必须进行 JSON Schema 校验。
- 校验失败时执行有限重试，例如最多 2 次。

#### 模块三：规则打分 + LLM 解释

- 先使用确定性规则计算基础分数。
- 再由 LLM 生成可解释理由、差距点、面试建议。
- 这样可以降低“纯生成式打分”带来的波动。

#### 模块四：报告持久化与查询

- 保存输入快照、结构化中间结果、最终报告。
- 支持通过 `session_id` / `report_id` 重查。

#### 模块五：前端展示

- 展示上传状态、分析状态、失败提示。
- 展示总分、维度分、优势、差距、建议面试问题。
- 提供“重新查看历史报告”能力。

### 10.6 逐步实施路径

#### 第一步：跑通最小闭环

- 只支持文本 JD + 单份简历上传。
- 后端同步执行完整流水线。
- 前端展示最终报告。

#### 第二步：补足工程稳定性

- 增加 Schema 校验、重试、错误码、日志。
- 增加幂等控制与报告持久化。
- 增加模型调用 trace。

#### 第三步：增强可配置能力

- 将模型参数、Prompt 版本、超时、重试下沉到配置中心或环境变量。
- 支持按任务切换模型。

#### 第四步：准备演进能力

- 为异步任务、SSE 进度、向量检索预留接口。
- 但不破坏现有数据契约。

### 10.7 非功能要求

- 单次分析超时目标：30-60 秒内返回结果。
- 失败可观测：必须能定位失败发生在“文本提取 / 简历解析 / JD 解析 / 报告生成”的哪一环。
- 输出可追踪：报告中必须保留 `model_trace`。
- 数据安全：简历文件和报告至少做到按会话隔离、接口最小鉴权、日志脱敏。

---

## 11. 工期方案（循序渐进）

> 以下以 **1 名后端 + 1 名前端 + 1 名兼顾测试/产品联调** 的轻量 MVP 团队估算；若由 1 人独立完成，整体工期通常需要放大到 1.5-2 倍。

### 11.1 总体估算

- **方案草拟 + 技术选型**：2-3 天
- **MVP 开发 + 联调 + 基础测试**：10-15 个工作日
- **缓冲与修正**：3-5 个工作日
- **总工期建议**：**3-4 周**

### 11.2 分阶段工期

#### 阶段 0：需求冻结与技术方案确认（2 天）

- 明确 MVP 边界、字段契约、验收标准。
- 确定前后端技术栈、数据库、文件存储方式。
- 明确 LLM Provider 抽象和配置方案。

**产出物**

- 产品方案定稿
- 接口草案
- 数据表草案
- Prompt 目录结构草案

#### 阶段 1：基础工程搭建（2-3 天）

- 初始化前后端项目。
- 建立数据库表结构与基础 API 框架。
- 打通文件上传、会话创建、基础页面路由。

**完成标准**

- 能创建 session
- 能上传简历
- 能提交 JD
- 数据可落库

#### 阶段 2：LLM 流水线最小实现（3-4 天）

- 实现简历文本提取。
- 实现 `resume -> CandidateProfile`。
- 实现 `jd -> JobSpec`。
- 实现 `CandidateProfile + JobSpec -> MatchReport`。
- 打通一次同步分析流程。

**完成标准**

- 输入一份真实简历和 JD 后，能返回结构化报告
- `model_trace` 可落库

#### 阶段 3：模型可配置与结构化校验（2-3 天）

- 抽象统一 `LLMService`。
- 接入配置文件 / 环境变量。
- 支持按任务配置模型。
- 接入 JSON Schema 校验与有限重试。

**完成标准**

- 无需改业务代码即可切换模型名或供应商
- 非法 JSON 输出可被识别并重试

#### 阶段 4：前端报告展示与联调（2-3 天）

- 完成分析中、成功、失败状态展示。
- 展示总分、维度、差距、建议问题。
- 支持刷新后按 `session_id/report_id` 查看结果。

**完成标准**

- 用户可完整走通上传、分析、查看报告流程

#### 阶段 5：稳定性与验收（2-3 天）

- 补充日志、错误码、超时处理。
- 完成基础测试用例。
- 进行联调验收与文档补齐。

**完成标准**

- 满足第 8 节 MVP 验收标准
- 关键异常有明确提示和落库记录

### 11.3 里程碑建议

- **M1（第 1 周结束）**：基础工程与数据链路打通
- **M2（第 2 周结束）**：LLM 主流程跑通并能生成报告
- **M3（第 3 周结束）**：模型可配置、前端可演示、满足 MVP 验收
- **M4（第 4 周可选）**：修复问题、补测试、准备试运行

### 11.4 风险与缓冲

- **风险 1：简历文本提取质量不稳定**
  - 预留 1-2 天处理 PDF/DOCX 差异和异常文件。
- **风险 2：模型结构化输出不稳定**
  - 通过低温度、Schema 校验、有限重试、Prompt 版本化控制。
- **风险 3：模型切换成本高**
  - 必须在第一版就完成 Provider 抽象，避免后续重构。
- **风险 4：单次分析耗时过长**
  - MVP 先同步，若超过体验阈值，再进入异步任务化。

### 11.5 建议的首版交付口径

- 交付一个能演示完整闭环的 Web MVP。
- 支持真实简历文件上传、JD 输入、匹配报告生成与结果留存。
- 支持通过配置切换大模型供应商/模型名/Prompt 版本。
- 暂不承诺复杂权限、多并发任务调度、OCR、向量检索。

