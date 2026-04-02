import { NextResponse } from "next/server";

import { createSession } from "@/server/application/session-service";
import { toSessionResponse } from "@/server/interfaces/http/mappers";

export async function POST() {
  const session = createSession();

  return NextResponse.json(toSessionResponse(session), {
    status: 201,
  });
}
