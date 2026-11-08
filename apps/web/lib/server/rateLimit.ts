import "server-only";
import { AppError } from "@smartgym/core";

/**
 * In-process fixed-window limiter for endpoints that the database-backed OTP limits
 * don't cover (password login). Single instance only; moves to Redis with the worker.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function limit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > max) {
    throw new AppError("RATE_LIMITED", "تعداد تلاش‌ها زیاد است. کمی بعد دوباره تلاش کنید.", {
      retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000),
    });
  }
}
