import crypto from "node:crypto";

const COOKIE_NAME = "session";
const TOKEN_BYTES = 32;
// 7 days
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return hmac.digest("base64url");
}

export function createSessionToken(userId: string): string {
  const nonce = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const payload = `${userId}:${nonce}`;
  const sig = sign(payload);
  return `${payload}:${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const lastColon = token.lastIndexOf(":");
  if (lastColon === -1) return null;

  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) {
    return null;
  }

  const firstColon = payload.indexOf(":");
  if (firstColon === -1) return null;

  return payload.slice(0, firstColon);
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // secure is intentionally omitted here — callers set it based on NODE_ENV
};
