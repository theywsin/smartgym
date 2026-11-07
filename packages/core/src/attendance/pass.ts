import crypto from "node:crypto";
import type { QrCheckInInput } from "@smartgym/validation";
import { AppError } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import type { TenantContext } from "../rbac/access";
import { getAthleteDashboardMember } from "../athlete";
import { checkIn } from "./index";

/**
 * QR check-in pass: `sgq1.<memberId>.<gymId>.<expSeconds>.<hmac>`.
 * Short-lived (rotates every minute on the athlete's screen), so a screenshot is useless a minute later.
 * The HMAC key is derived from JWT_SECRET; nothing is stored.
 */
export const CHECKIN_PASS_TTL_S = 90;
const PREFIX = "sgq1";

function key(deps: CoreDeps) {
  return crypto.createHmac("sha256", deps.config.jwtSecret).update("smartgym/qr-checkin/v1").digest();
}
function sign(deps: CoreDeps, body: string) {
  return crypto.createHmac("sha256", key(deps)).update(body).digest("base64url");
}

export async function issueCheckinPass(deps: CoreDeps, user: { id: string; phone: string }, memberId: string) {
  const m = await getAthleteDashboardMember(deps, user, memberId);
  const exp = Math.floor(nowOf(deps).getTime() / 1000) + CHECKIN_PASS_TTL_S;
  const body = `${PREFIX}.${m.id}.${m.gymId}.${exp}`;
  return { token: `${body}.${sign(deps, body)}`, expiresAt: new Date(exp * 1000) };
}

const invalid = () => new AppError("BUSINESS_RULE", "کد QR نامعتبر یا منقضی است. از عضو بخواهید کد را تازه کند.");

export function verifyCheckinPass(deps: CoreDeps, token: string): { memberId: string; gymId: string } {
  const parts = token.trim().split(".");
  if (parts.length !== 5 || parts[0] !== PREFIX) throw invalid();
  const [, memberId, gymId, expS, sig] = parts as [string, string, string, string, string];
  const expected = Buffer.from(sign(deps, parts.slice(0, 4).join(".")));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw invalid();
  if (!/^\d+$/.test(expS) || Number(expS) * 1000 < nowOf(deps).getTime()) throw invalid();
  return { memberId, gymId };
}

/** Reception scans a member's pass. A pass from another gym is treated as invalid (no cross-tenant hint). */
export async function checkInWithPass(deps: CoreDeps, ctx: TenantContext, input: QrCheckInInput) {
  const pass = verifyCheckinPass(deps, input.token);
  if (pass.gymId !== ctx.gymId) throw invalid();
  return checkIn(deps, ctx, { memberId: pass.memberId, branchId: input.branchId }, "QR");
}
