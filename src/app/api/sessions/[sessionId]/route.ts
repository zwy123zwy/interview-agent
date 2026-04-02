import { NextResponse } from "next/server";

import { findSession } from "@/server/application/session-service";
import { toSessionResponse } from "@/server/interfaces/http/mappers";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const session = findSession(sessionId);

  if (!session) {
    return NextResponse.json(
      {
        error_code: "SESSION_NOT_FOUND",
        message: "Session not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(toSessionResponse(session));
}
