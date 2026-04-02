import type { ChatConversation, ChatMessage } from "@/server/domain/chat";

const conversationStore = new Map<string, ChatConversation>();

export function getConversation(conversationId: string) {
  return conversationStore.get(conversationId) ?? null;
}

export function listConversations() {
  return [...conversationStore.values()].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1,
  );
}

export function saveConversation(conversation: ChatConversation) {
  conversationStore.set(conversation.conversationId, conversation);
  return conversation;
}

export function appendConversationMessage(
  conversationId: string,
  message: ChatMessage,
) {
  const current = conversationStore.get(conversationId);

  const next: ChatConversation = {
    conversationId,
    messages: [...(current?.messages ?? []), message],
    updatedAt: new Date().toISOString(),
  };

  conversationStore.set(conversationId, next);
  return next;
}
