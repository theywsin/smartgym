import type { OtpPurpose, User } from "@smartgym/db";
import { AppError } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { hmac, randomOtp, safeEqualHex } from "./crypto";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_PHONE = 3;
const MAX_PER_IP = 10;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function codeHash(deps: CoreDeps, phone: string, code: string): string {
  return hmac(deps.config.otpPepper, `${phone}:${code}`);
}

/**
 * Creates and sends a one-time code. Always resolves the same way whether or not the
 * phone has an account, so the endpoint cannot be used to discover users.
 */
export async function requestOtp(
  deps: CoreDeps,
  input: { phone: string; purpose: OtpPurpose; ip?: string | null }
): Promise<{ expiresInSeconds: number; resendInSeconds: number }> {
  const now = nowOf(deps);
  const since = new Date(now.getTime() - WINDOW_MS);

  const recent = await deps.db.otpChallenge.findMany({
    where: { phone: input.phone, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const last = recent[0];
  if (last && now.getTime() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - last.createdAt.getTime())) / 1000);
    throw new AppError("RATE_LIMITED", `لطفاً ${wait} ثانیه دیگر دوباره تلاش کنید.`, { retryAfterSeconds: wait });
  }
  if (recent.length >= MAX_PER_PHONE) {
    throw new AppError("RATE_LIMITED", "تعداد درخواست کد برای این شماره زیاد است. ۱۰ دقیقه دیگر تلاش کنید.", {
      retryAfterSeconds: 600,
    });
  }
  if (input.ip) {
    const perIp = await deps.db.otpChallenge.count({ where: { ip: input.ip, createdAt: { gte: since } } });
    if (perIp >= MAX_PER_IP) {
      throw new AppError("RATE_LIMITED", "تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.", { retryAfterSeconds: 600 });
    }
  }

  // Send first when the provider makes the code itself (Melipayamak OTP); otherwise we make it and send after saving.
  let code: string;
  try {
    code = deps.sms.createOtp ? (await deps.sms.createOtp(input.phone)).code : randomOtp();
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "otp sms failed", err: String(err) }));
    throw new AppError("BUSINESS_RULE", "ارسال پیامک انجام نشد. چند دقیقه بعد دوباره تلاش کنید.");
  }
  const expiresAt = new Date(now.getTime() + deps.config.otpTtlSeconds * 1000);
  // Invalidate older open codes for this phone so only the newest works.
  await deps.db.otpChallenge.updateMany({
    where: { phone: input.phone, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });
  await deps.db.otpChallenge.create({
    data: { phone: input.phone, purpose: input.purpose, codeHash: codeHash(deps, input.phone, code), ip: input.ip ?? null, expiresAt },
  });

  if (!deps.sms.createOtp) await deps.sms.sendOtp(input.phone, code);
  return { expiresInSeconds: deps.config.otpTtlSeconds, resendInSeconds: RESEND_COOLDOWN_MS / 1000 };
}

/**
 * Verifies a code. On success the phone is marked verified and the user is returned,
 * created on first login (phone + OTP is both registration and login).
 */
export async function verifyOtp(deps: CoreDeps, input: { phone: string; code: string }): Promise<{ user: User; isNewUser: boolean }> {
  const now = nowOf(deps);
  const invalid = new AppError("BAD_REQUEST", "کد تأیید نادرست یا منقضی شده است.");

  const challenge = await deps.db.otpChallenge.findFirst({
    where: { phone: input.phone, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) throw invalid;
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await deps.db.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: now } });
    throw new AppError("RATE_LIMITED", "تعداد تلاش‌ها بیش از حد مجاز است. کد جدید درخواست کنید.");
  }

  // Count the attempt before comparing, atomically, so parallel guesses are bounded.
  const bumped = await deps.db.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (bumped.count === 0) throw invalid;

  if (!safeEqualHex(challenge.codeHash, codeHash(deps, input.phone, input.code))) throw invalid;

  // Single use: only one concurrent request can consume it.
  const consumed = await deps.db.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: now },
  });
  if (consumed.count === 0) throw invalid;

  const existing = await deps.db.user.findUnique({ where: { phone: input.phone } });
  if (existing?.status === "DISABLED") throw new AppError("FORBIDDEN", "این حساب کاربری غیرفعال شده است.");

  const user = await deps.db.user.upsert({
    where: { phone: input.phone },
    update: { phoneVerifiedAt: existing?.phoneVerifiedAt ?? now, lastLoginAt: now },
    create: { phone: input.phone, phoneVerifiedAt: now, lastLoginAt: now },
  });
  return { user, isNewUser: !existing };
}
