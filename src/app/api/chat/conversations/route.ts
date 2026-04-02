import { NextResponse } from "next/server";

import { listConversations } from "@/server/infrastructure/store/conversation-store";
import { getSessionUserId } from "@/server/infrastructure/auth/session-reader";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error_code: "UNAUTHORIZED", message: "Not authenticated", retryable: false },
      { status: 401 },
    );
  }

  const conversations = (await listConversations(userId)).map((conversation) => ({
    conversationId: conversation.conversationId,
    updatedAt: conversation.updatedAt,
    preview: conversation.messages.at(-1)?.content ?? "",
    messageCount: conversation.messages.length,
  }));

  return NextResponse.json({
    items: conversations,
  });
}
