import { NextResponse } from "next/server";

import type { RegisterPayload } from "@/server/domain/auth/auth-types";
import { registerUser } from "@/server/application/auth/register-user";

export async function handleRegisterRequest(request: Request) {
  const body = (await request.json()) as RegisterPayload;
  const result = await registerUser(body.userId ?? "", body.password ?? "", body.registrationCode ?? "");

  if (!result.ok) {
    return NextResponse.json(
      { error_code: result.error_code, message: result.message, retryable: false },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}

