/**
 * Background jobs. Run one instance next to the web app:
 *   npm start -w @smartgym/worker        (loop, every WORKER_INTERVAL_MINUTES, default 15)
 *   npm run once -w @smartgym/worker     (single pass, e.g. from a systemd timer or cron)
 * Uses the same DATABASE_URL (non-owner role) and SMS settings as the web app.
 * Every job is safe to run twice: reminders are claimed in notification_log before sending.
 */
import { createSmsProviderFromEnv, DEFAULT_CONFIG, expireOnlinePaymentRequests, runExpiryReminders, type CoreDeps } from "@smartgym/core";
import { createPrismaClient } from "@smartgym/db";

const TEHRAN_OFFSET_MS = 3.5 * 3600_000;
/** SMS only during the day in Tehran (09:00 to 20:59). */
export function isSendingHour(now: Date): boolean {
  const h = new Date(now.getTime() + TEHRAN_OFFSET_MS).getUTCHours();
  return h >= 9 && h < 21;
}

const log = (msg: string, extra: Record<string, unknown> = {}) => console.info(JSON.stringify({ level: "info", svc: "worker", msg, ...extra }));

async function tick(deps: CoreDeps) {
  const expired = await expireOnlinePaymentRequests(deps);
  if (expired.expired) log("payment links expired", expired);
  if (isSendingHour(new Date())) {
    const r = await runExpiryReminders(deps);
    if (r.skippedNoTemplate) log("expiry reminders skipped: SMS template not configured");
    else if (r.sent || r.failed) log("expiry reminders", r);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const deps: CoreDeps = {
    db: createPrismaClient(process.env.DATABASE_URL),
    sms: createSmsProviderFromEnv(process.env),
    // The worker never issues logins; these are only needed to satisfy the shared config type.
    config: { ...DEFAULT_CONFIG, otpPepper: "worker-unused-0000000000000000000000", jwtSecret: "worker-unused-0000000000000000000000" },
  };
  if (process.argv.includes("--once")) {
    await tick(deps);
    log("done");
    await deps.db.$disconnect();
    return;
  }
  const minutes = Math.max(1, Number(process.env.WORKER_INTERVAL_MINUTES ?? 15));
  log("started", { everyMinutes: minutes, sms: deps.sms.name });
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await tick(deps);
    } catch (err) {
      console.error(JSON.stringify({ level: "error", svc: "worker", msg: "tick failed", err: String(err) }));
    } finally {
      running = false;
    }
  };
  await run();
  const timer = setInterval(run, minutes * 60_000);
  const stop = async () => {
    clearInterval(timer);
    await deps.db.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
