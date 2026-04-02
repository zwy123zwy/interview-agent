import type { ContextHint } from "@/server/domain/chat";

export function buildContextHints(message: string): ContextHint[] {
  const hints: ContextHint[] = [
    {
      type: "product",
      label: "当前产品方向",
      content:
        "系统当前正在从固定表单分析流转向聊天驱动入口，前端优先提供文本请求与对话体验。",
    },
  ];

  if (message.includes("简历") || message.toLowerCase().includes("resume")) {
    hints.push({
      type: "document",
      label: "简历处理上下文",
      content: "后续可补上传与解析工具，但当前更优先打通聊天入口与编排层。",
    });
  }

  if (message.includes("插件") || message.includes("skill")) {
    hints.push({
      type: "product",
      label: "插件与技能上下文",
      content:
        "产品内的插件和技能需要通过注册表与编排器模拟，不能直接依赖当前开发环境的外部工具。",
    });
  }

  return hints;
}
