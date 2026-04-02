import { NextResponse } from "next/server";

import { listConversations } from "@/server/infrastructure/store/conversation-store";

export async function GET() {
  const conversations = (await listConversations()).map((conversation) => ({
    conversationId: conversation.conversationId,
    updatedAt: conversation.updatedAt,
    preview: conversation.messages.at(-1)?.content ?? "",
    messageCount: conversation.messages.length,
  }));

  return NextResponse.json({
    items: conversations,
  });
}
