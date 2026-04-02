function parseCodes(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}

export function isRegistrationCodeValid(code: string) {
  const validCodes = parseCodes(process.env.REGISTRATION_CODES);
  if (validCodes.length === 0) {
    return false;
  }

  return validCodes.includes(code.trim());
}

