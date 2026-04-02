import { isValidUserId, normalizeUserId } from "@/server/domain/auth/user-identity";
import { hashPassword } from "@/server/infrastructure/auth/password-hasher";
import { isRegistrationCodeValid } from "@/server/infrastructure/auth/registration-code-store";
import { findUserById, insertUser } from "@/server/infrastructure/auth/user-repository";

export async function registerUser(rawUserId: string, rawPassword: string, rawRegistrationCode: string) {
  const userId = normalizeUserId(rawUserId);
  const password = rawPassword ?? "";
  const registrationCode = rawRegistrationCode?.trim() ?? "";

  if (!isValidUserId(userId)) {
    return { ok: false as const, status: 400, error_code: "INVALID_USER_ID", message: "userId is invalid" };
  }

  if (password.trim().length < 6) {
    return { ok: false as const, status: 400, error_code: "INVALID_PASSWORD", message: "password is invalid" };
  }

  if (!isRegistrationCodeValid(registrationCode)) {
    return {
      ok: false as const,
      status: 403,
      error_code: "REGISTRATION_CODE_NOT_MATCHED",
      message: "registration code is invalid",
    };
  }

  const existing = await findUserById(userId);
  if (existing) {
    return { ok: false as const, status: 409, error_code: "USER_ALREADY_EXISTS", message: "user already exists" };
  }

  await insertUser(userId, hashPassword(password));
  return { ok: true as const };
}

