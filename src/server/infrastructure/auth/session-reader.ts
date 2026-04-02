import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/server/infrastructure/auth/session-token";

/**
 * Read and verify the session cookie from the current request.
 * Returns the authenticated userId, or null if missing / invalid.
 *
 * Use this in Route Handlers (server-side only).
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE.name)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
