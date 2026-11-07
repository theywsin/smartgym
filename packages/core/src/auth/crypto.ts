import crypto from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

/** 256-bit random token, URL-safe. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hmac(secret: string, value: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/** 6-digit code from a CSPRNG. */
export function randomOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// argon2id, OWASP 2024 baseline: m=19 MiB, t=2, p=1
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password);
  } catch {
    return false;
  }
}
