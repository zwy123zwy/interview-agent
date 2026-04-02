import { NextResponse } from "next/server";

import { getConversation } from "@/server/infrastructure/store/conversation-store";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { conversationId } = await context.params;
  const conversation = await getConversation(conversationId);

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
