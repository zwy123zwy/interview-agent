import { NextResponse } from "next/server";

import { runSession } from "@/server/application/session-service";
import type { RunSessionResponseDto } from "@/server/interfaces/http/dto";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const result = runSession(sessionId);

  if (!result) {
    return NextResponse.json(
      {
        error_code: "SESSION_NOT_FOUND",
        message: "Session not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  const response: RunSessionResponseDto = {
    status: result.session.status,
    report: {
      report_id: result.report.report_id,
      score_total: result.report.score_total,
    },
  };

  return NextResponse.json(response);
}
