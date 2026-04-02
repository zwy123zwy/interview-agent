import type { SkillDecision } from "@/server/domain/chat";

const SKILL_CATALOG = [
  {
    name: "context_enricher",
    keywords: ["方案", "上下文", "背景", "需求"],
    reason: "当前请求需要补足产品和工程上下文。",
  },
  {
    name: "planner",
    keywords: ["计划", "步骤", "工期", "拆解"],
    reason: "当前请求带有任务分解或计划性质。",
  },
  {
    name: "llm_router",
    keywords: ["模型", "llm", "prompt", "skill", "插件"],
    reason: "当前请求涉及模型、技能或插件选择。",
  },
];

export function decideSkills(message: string): SkillDecision[] {
  const lowered = message.toLowerCase();

  return SKILL_CATALOG.map((skill) => ({
    name: skill.name,
    reason: skill.reason,
    enabled: skill.keywords.some((keyword) => lowered.includes(keyword)),
  }));
}
