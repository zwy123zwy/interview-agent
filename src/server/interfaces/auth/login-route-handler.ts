import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { LoginPayload } from "@/server/domain/auth/auth-types";
import { loginUser } from "@/server/application/auth/login-user";
import { createSessionToken, SESSION_COOKIE } from "@/server/infrastructure/auth/session-token";

export async function handleLoginRequest(request: Request) {
  const body = (await request.json()) as LoginPayload;
  const result = await loginUser(body.userId ?? "", body.password ?? "");

  if (!result.ok) {
    return NextResponse.json(
      { error_code: result.error_code, message: result.message, retryable: false },
      { status: result.status },
    );
  }

  const token = createSessionToken(result.userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, token, {
    ...SESSION_COOKIE,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}

