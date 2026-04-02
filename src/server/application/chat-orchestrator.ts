import type { ChatMessage, ChatRequest } from "@/server/domain/chat";
import { createId } from "@/server/infrastructure/ids";
import {
  appendConversationMessage,
  getConversation,
  saveConversation,
} from "@/server/infrastructure/store/conversation-store";
import { buildContextHints } from "@/server/application/chat-context-service";
import { decideTools } from "@/server/infrastructure/agent/tool-registry";
import { decideSkills } from "@/server/infrastructure/agent/skill-registry";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: createId("msg"),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function buildAssistantReply(message: string, contextSummary: string[]): string {
  const lines = [
    `已收到请求：${message}`,
    "当前会先进入聊天编排层，而不是直接执行固定流水线。",
  ];

  if (contextSummary.length > 0) {
    lines.push(`补充上下文：${contextSummary.join("；")}`);
  }

  lines.push("下一步可以继续路由到简历解析、JD 匹配、报告生成或工程任务拆解。");

  return lines.join("\n");
}

export async function prepareChatTurn(request: ChatRequest) {
  const conversationId = request.conversationId ?? createId("conv");
  const existing = await getConversation(conversationId);

  if (!existing) {
    await saveConversation({
      conversationId,
      messages: [],
      updatedAt: new Date().toISOString(),
    });
  }

  const userMessage = createMessage("user", request.message);
  const conversation = await appendConversationMessage(conversationId, userMessage);
  const toolDecisions = decideTools(request.message);
  const skillDecisions = decideSkills(request.message);
  const contextHints = buildContextHints(request.message);
  const replyId = createId("msg");

  return {
    conversationId,
    replyId,
    userMessage,
    conversation,
    toolDecisions,
    skillDecisions,
    contextHints,
  };
}

export async function finalizeAssistantTurn(conversationId: string, replyId: string, content: string) {
  const assistantMessage: ChatMessage = {
    id: replyId,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };

  await appendConversationMessage(conversationId, assistantMessage);
  return assistantMessage;
}

export function buildChatFallbackReply(request: ChatRequest) {
  const toolDecisions = decideTools(request.message);
  const skillDecisions = decideSkills(request.message);
  const contextHints = buildContextHints(request.message);

  return {
    toolDecisions,
    skillDecisions,
    contextHints,
    content: buildAssistantReply(
      request.message,
      contextHints.map((hint) => `${hint.label}: ${hint.content}`),
    ),
  };
}
