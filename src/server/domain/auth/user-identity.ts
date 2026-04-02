const VALID_USER_ID = /^[a-z0-9_-]{3,64}$/;

export function normalizeUserId(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUserId(userId: string) {
  return VALID_USER_ID.test(userId);
}

