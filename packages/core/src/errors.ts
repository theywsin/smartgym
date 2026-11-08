export type ErrorCode =
  | "VALIDATION_FAILED"
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "FORBIDDEN"
  | "MODULE_NOT_IN_PLAN"
  | "GYM_SUSPENDED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  MODULE_NOT_IN_PLAN: 403,
  GYM_SUSPENDED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** An error that is safe to show to the client (message in Persian). */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;

  constructor(code: ErrorCode, message: string, extra: { fields?: Record<string, string[]>; retryAfterSeconds?: number } = {}) {
    super(message);
    this.code = code;
    this.status = STATUS[code];
    this.fields = extra.fields;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

export const forbidden = () => new AppError("FORBIDDEN", "شما به این بخش دسترسی ندارید.");
export const notFound = (what = "مورد درخواستی") => new AppError("NOT_FOUND", `${what} یافت نشد.`);
