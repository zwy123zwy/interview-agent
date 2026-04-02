import { NextResponse } from "next/server";

import { findReport } from "@/server/application/session-service";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { reportId } = await context.params;
  const report = findReport(reportId);

  if (!report) {
    return NextResponse.json(
      {
        error_code: "REPORT_NOT_FOUND",
        message: "Report not found",
        retryable: false,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(report);
}
