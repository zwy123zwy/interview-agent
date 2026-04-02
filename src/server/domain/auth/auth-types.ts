export type LoginPayload = {
  userId?: string;
  password?: string;
};

export type RegisterPayload = {
  userId?: string;
  password?: string;
  registrationCode?: string;
};

export type AuthErrorCode =
  | "INVALID_USER_ID"
  | "INVALID_PASSWORD"
  | "AUTH_FAILED"
  | "REGISTRATION_CODE_NOT_MATCHED"
  | "USER_ALREADY_EXISTS";

