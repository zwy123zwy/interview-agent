import type { ToolDecision } from "@/server/domain/chat";

const TOOL_CATALOG = [
  {
    name: "resume_parser",
    keywords: ["简历", "resume", "解析"],
    reason: "用户请求和简历解析相关，后续可接入文件与结构化抽取能力。",
  },
  {
    name: "jd_matcher",
    keywords: ["jd", "岗位", "匹配", "match"],
    reason: "用户请求和岗位匹配相关，后续可接入匹配评分能力。",
  },
  {
    name: "report_builder",
    keywords: ["报告", "总结", "输出"],
    reason: "用户关注报告生成，后续可接入报告拼装与总结能力。",
  },
];

export function decideTools(message: string): ToolDecision[] {
  const lowered = message.toLowerCase();

  return TOOL_CATALOG.map((tool) => ({
    name: tool.name,
    reason: tool.reason,
    enabled: tool.keywords.some((keyword) => lowered.includes(keyword)),
  }));
}
