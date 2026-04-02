import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/infrastructure/auth/session-token";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, "", { maxAge: 0, path: "/" });
  return NextResponse.json({ ok: true });
}
