import { Request, Response, NextFunction } from "express";

/**
 * Small in-memory fixed-window rate limiter (single process).
 * Interim protection for the prototype; SmartGym 2.0 uses Redis-backed limits.
 */
export function rateLimit(opts: { windowMs: number; max: number; key: (req: Request) => string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, Math.min(opts.windowMs, 60_000)).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const k = opts.key(req);
    let entry = hits.get(k);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(k, entry);
    }
    entry.count++;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ success: false, message: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید." });
      return;
    }
    next();
  };
}
