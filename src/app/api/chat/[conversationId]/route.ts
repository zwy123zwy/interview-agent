import { NextResponse } from "next/server";

import { getConversationForUser } from "@/server/infrastructure/store/conversation-store";
import { getSessionUserId } from "@/server/infrastructure/auth/session-reader";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error_code: "UNAUTHORIZED", message: "Not authenticated", retryable: false },
      { status: 401 },
    );
  }

  const { conversationId } = await context.params;
  const conversation = await getConversationForUser(userId, conversationId);

  if (!conversation) {
    return NextResponse.json(
      {
        error_code: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(conversation);
}
