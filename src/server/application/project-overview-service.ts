import { createSessionSeed } from "@/server/domain/models";
import { getLlmConfig } from "@/server/infrastructure/config/env";

export function getProjectOverview() {
  const llm = getLlmConfig();
  const sessionSeed = createSessionSeed("sess_demo");

  return {
    app: {
      name: "interview-agent",
      mode: "mvp",
    },
    sessionSeed,
    llm,
    modules: {
      app: "页面与路由",
      application: "分析流程编排",
      domain: "契约与领域模型",
      infrastructure: "LLM、日志、文件与后续数据库",
      interfaces: "API 路由与 DTO",
    },
  };
}
