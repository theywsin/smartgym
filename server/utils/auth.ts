import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * JWT secret handling.
 * - Never fall back to a hard-coded secret.
 * - If JWT_SECRET is missing (or still one of the old example values), a random
 *   per-process secret is generated. Tokens then stop working after a restart,
 *   which is safe; set JWT_SECRET in production to keep sessions across restarts.
 */
const KNOWN_WEAK_SECRETS = new Set([
  "",
  "smartgym_jwt_secret_token_abc_789",
  "smartgym_session_secret_xyz_123",
]);

let cachedSecret: string | null = null;
function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.JWT_SECRET || "";
  if (KNOWN_WEAK_SECRETS.has(fromEnv) || fromEnv.length < 32) {
    console.warn(
      "⚠️ JWT_SECRET is missing or weak. Using a random secret for this process; " +
        "all logins will be invalidated on restart. Set a random JWT_SECRET of 32+ characters."
    );
    cachedSecret = crypto.randomBytes(48).toString("hex");
  } else {
    cachedSecret = fromEnv;
  }
  return cachedSecret;
}

export type AuthRole = "SUPER_ADMIN" | "GYM_OWNER" | "COACH" | "MEMBER";

export interface TokenPayload {
  userId: string;
  username: string;
  role: AuthRole;
  clubId?: string;
}

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isPasswordHash(value: unknown): boolean {
  return typeof value === "string" && BCRYPT_PATTERN.test(value);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh) && a.length === b.length;
}

/**
 * Verifies a password against a stored value. Supports legacy plain-text values
 * (from the prototype) so existing accounts keep working; callers should
 * re-hash when `needsRehash` is true.
 */
export async function verifyPassword(
  password: string,
  stored: unknown
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (typeof password !== "string" || password.length === 0) return { ok: false, needsRehash: false };
  if (typeof stored !== "string" || stored.length === 0) return { ok: false, needsRehash: false };
  if (isPasswordHash(stored)) {
    return { ok: await bcrypt.compare(password, stored), needsRehash: false };
  }
  const ok = timingSafeEqualStrings(password, stored);
  return { ok, needsRehash: ok };
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "12h" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
