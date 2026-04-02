import { isValidUserId, normalizeUserId } from "@/server/domain/auth/user-identity";
import { verifyPassword } from "@/server/infrastructure/auth/password-hasher";
import { findUserById } from "@/server/infrastructure/auth/user-repository";

export async function loginUser(rawUserId: string, rawPassword: string) {
  const userId = normalizeUserId(rawUserId);
  const password = rawPassword ?? "";

  if (!isValidUserId(userId)) {
    return { ok: false as const, status: 400, error_code: "INVALID_USER_ID", message: "userId is invalid" };
  }

  if (!password.trim()) {
    return { ok: false as const, status: 400, error_code: "INVALID_PASSWORD", message: "password is required" };
  }

  const user = await findUserById(userId);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false as const, status: 403, error_code: "AUTH_FAILED", message: "invalid credentials" };
  }

  return { ok: true as const, userId };
}

