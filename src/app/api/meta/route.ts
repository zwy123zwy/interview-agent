import { NextResponse } from "next/server";

import { getProjectOverview } from "@/server/application/project-overview-service";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: getProjectOverview(),
  });
}
