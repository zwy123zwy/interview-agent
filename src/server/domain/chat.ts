export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  conversationId: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface ChatRequest {
  userId: string;
  conversationId?: string;
  message: string;
}

export interface ContextHint {
  type: "product" | "session" | "report" | "document";
  label: string;
  content: string;
}

export interface ToolDecision {
  name: string;
  reason: string;
  enabled: boolean;
}

export interface SkillDecision {
  name: string;
  reason: string;
  enabled: boolean;
}

export interface ChatResponse {
  conversationId: string;
  reply: ChatMessage;
  toolDecisions: ToolDecision[];
  skillDecisions: SkillDecision[];
  contextHints: ContextHint[];
}
