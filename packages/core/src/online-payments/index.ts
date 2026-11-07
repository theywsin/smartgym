import crypto from "node:crypto";
import { withSystem, withTenant } from "@smartgym/db";
import { formatToman } from "@smartgym/shared";
import { AppError, forbidden, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole, canAccessBranch, hasPermission } from "../rbac/access";
import { findAccessibleMember } from "../members";
import { subscriptionBalance } from "../finance";
import type { GatewayCallback, PaymentGateway } from "./gateway";

export * from "./gateway";

const SETTINGS_KEY = "payments.saman";
const LINK_TTL_MS = 3 * 86_400_000;
/** Shaparak minimum is 1,000 toman. */
const MIN_ONLINE_RIAL = 10_000n;

export type OnlinePaymentSettings = {
  terminalId: string | null;
};

function readSettings(value: unknown): OnlinePaymentSettings {
  const v = (value ?? {}) as { terminalId?: unknown };
  return { terminalId: typeof v.terminalId === "string" && v.terminalId ? v.terminalId : null };
}

export async function getOnlinePaymentSettings(deps: CoreDeps, ctx: TenantContext): Promise<OnlinePaymentSettings> {
  if (!hasPermission(ctx, "settings.manage") && !hasPermission(ctx, "finance.manage")) throw forbidden();
  return withTenant(deps.db, ctx, async (tx) => {
    const row = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: ctx.gymId, key: SETTINGS_KEY } } });
    return readSettings(row?.value);
  });
}

export async function setOnlinePaymentSettings(deps: CoreDeps, ctx: TenantContext, input: { terminalId: string | null }) {
  requirePermission(ctx, "settings.manage");
  requireWritableGym(ctx);
  return withTenant(deps.db, ctx, async (tx) => {
    const before = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: ctx.gymId, key: SETTINGS_KEY } } });
    const value = { terminalId: input.terminalId };
    await tx.gymSetting.upsert({
      where: { gymId_key: { gymId: ctx.gymId, key: SETTINGS_KEY } },
      create: { gymId: ctx.gymId, key: SETTINGS_KEY, value },
      update: { value },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "settings.payments.update", entityType: "gym_setting", entityId: null,
      before: readSettings(before?.value), after: value,
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return readSettings(value);
  });
}

function publicView(r: { resNum: string; amountRial: bigint; status: string; expiresAt: Date; createdAt: Date; settledAt: Date | null; refNum: string | null; rrn: string | null; failureReason: string | null }) {
  return {
    resNum: r.resNum,
    amountRial: r.amountRial,
    status: r.status,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    settledAt: r.settledAt,
    rrn: r.rrn,
    failureReason: r.failureReason,
  };
}

/** Staff create a pay-by-link request for (part of) a sold period's debt. */
export async function createPaymentLink(deps: CoreDeps, ctx: TenantContext, input: { subscriptionId: string; amountRial?: bigint }) {
  requirePermission(ctx, "memberships.manage");
  requireWritableGym(ctx);
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const sub = await tx.memberSubscription.findFirst({ where: { id: input.subscriptionId, gymId: ctx.gymId } });
    if (!sub) throw notFound("اشتراک");
    await findAccessibleMember(tx, ctx, sub.memberId);
    if (sub.branchId && !canAccessBranch(ctx, sub.branchId)) throw forbidden();
    const setting = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: ctx.gymId, key: SETTINGS_KEY } } });
    if (!readSettings(setting?.value).terminalId) {
      throw new AppError("BUSINESS_RULE", "درگاه پرداخت آنلاین هنوز تنظیم نشده است. شماره ترمینال سامان را در تنظیمات وارد کنید.");
    }
    const { due } = await subscriptionBalance(tx, sub.id);
    const amount = input.amountRial ?? due;
    if (due <= 0n) throw new AppError("BUSINESS_RULE", "این اشتراک بدهی ندارد.");
    if (amount > due) {
      const msg = `مبلغ از بدهی (${formatToman(due)}) بیشتر است.`;
      throw new AppError("VALIDATION_FAILED", msg, { fields: { amountRial: [msg] } });
    }
    if (amount < MIN_ONLINE_RIAL) {
      const msg = "حداقل مبلغ پرداخت آنلاین ۱٬۰۰۰ تومان است.";
      throw new AppError("VALIDATION_FAILED", msg, { fields: { amountRial: [msg] } });
    }
    const req = await tx.onlinePaymentRequest.create({
      data: {
        gymId: ctx.gymId,
        branchId: sub.branchId,
        memberId: sub.memberId,
        subscriptionId: sub.id,
        amountRial: amount,
        resNum: crypto.randomBytes(18).toString("base64url"),
        createdByUserId: ctx.userId,
        expiresAt: new Date(now.getTime() + LINK_TTL_MS),
      },
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "payment_link.create", entityType: "online_payment_request", entityId: req.id,
      after: { subscriptionId: sub.id, amountRial: amount.toString() },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return publicView(req);
  });
}

export async function listPaymentLinks(deps: CoreDeps, ctx: TenantContext, memberId: string) {
  requirePermission(ctx, "members.read");
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    await findAccessibleMember(tx, ctx, memberId);
    const rows = await tx.onlinePaymentRequest.findMany({ where: { gymId: ctx.gymId, memberId }, orderBy: { createdAt: "desc" }, take: 20 });
    return rows.map((r) => publicView({ ...r, status: r.status === "PENDING" && r.expiresAt <= now ? "EXPIRED" : r.status }));
  });
}

/** What the payer sees on /pay/{resNum}. No login: the 144-bit resNum is the capability. */
export async function getPublicPayment(deps: CoreDeps, resNum: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const r = await tx.onlinePaymentRequest.findUnique({ where: { resNum } });
    if (!r) throw notFound("لینک پرداخت");
    const [gym, member] = await Promise.all([
      tx.gym.findUniqueOrThrow({ where: { id: r.gymId }, select: { name: true } }),
      tx.member.findUniqueOrThrow({ where: { id: r.memberId }, select: { firstName: true } }),
    ]);
    const status = r.status === "PENDING" && r.expiresAt <= now ? "EXPIRED" : r.status;
    return { ...publicView({ ...r, status }), gymName: gym.name, memberFirstName: member.firstName };
  });
}

function toLocalMobile(phone: string | null): string | undefined {
  if (!phone) return undefined;
  return phone.startsWith("+98") ? `0${phone.slice(3)}` : undefined;
}

/** Payer pressed "pay": get a fresh gateway token and return the bank URL. */
export async function startOnlinePayment(deps: CoreDeps, gateway: PaymentGateway, resNum: string, callbackUrl: string) {
  const now = nowOf(deps);
  const prepared = await withSystem(deps.db, async (tx) => {
    const r = await tx.onlinePaymentRequest.findUnique({ where: { resNum } });
    if (!r) throw notFound("لینک پرداخت");
    if (r.status === "PAID") throw new AppError("CONFLICT", "این لینک قبلاً پرداخت شده است.");
    if (r.status !== "PENDING" || r.expiresAt <= now) throw new AppError("BUSINESS_RULE", "این لینک پرداخت منقضی شده است. از باشگاه لینک جدید بخواهید.");
    const { due } = await subscriptionBalance(tx, r.subscriptionId);
    if (r.amountRial > due) throw new AppError("BUSINESS_RULE", "بدهی این اشتراک تغییر کرده است. از باشگاه لینک جدید بخواهید.");
    const setting = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: r.gymId, key: SETTINGS_KEY } } });
    const terminalId = readSettings(setting?.value).terminalId;
    if (!terminalId) throw new AppError("BUSINESS_RULE", "درگاه پرداخت این باشگاه فعال نیست.");
    const member = await tx.member.findUniqueOrThrow({ where: { id: r.memberId }, select: { phone: true } });
    return { r, terminalId, cell: toLocalMobile(member.phone) };
  });
  let token;
  try {
    token = await gateway.requestToken({ terminalId: prepared.terminalId, amountRial: prepared.r.amountRial, resNum, callbackUrl, cellNumber: prepared.cell });
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "gateway token failed", gateway: gateway.name, err: String(err) }));
    throw new AppError("BUSINESS_RULE", "اتصال به درگاه بانک برقرار نشد. چند دقیقه بعد دوباره تلاش کنید.");
  }
  await withSystem(deps.db, (tx) =>
    tx.onlinePaymentRequest.updateMany({ where: { id: prepared.r.id, status: "PENDING" }, data: { token: token.token, gateway: gateway.name } })
  );
  return { redirectUrl: token.redirectUrl };
}

export type SettleOutcome = { resNum: string | null; status: "PAID" | "FAILED" | "PENDING" | "EXPIRED" };

/**
 * Bank callback. Idempotent: a replayed callback for a PAID request returns PAID without a second payment.
 * The callback body is untrusted; money is recorded only after VerifyTransaction confirms the exact amount.
 */
export async function settleGatewayCallback(deps: CoreDeps, gateway: PaymentGateway, cb: GatewayCallback): Promise<SettleOutcome> {
  const resNum = cb.ResNum?.trim();
  if (!resNum) return { resNum: null, status: "FAILED" };
  const now = nowOf(deps);

  return withSystem(deps.db, async (tx) => {
    const found = await tx.onlinePaymentRequest.findUnique({ where: { resNum }, select: { id: true } });
    if (!found) return { resNum: null, status: "FAILED" } as SettleOutcome;
    await tx.$queryRaw`SELECT id FROM "online_payment_request" WHERE id = ${found.id}::uuid FOR UPDATE`;
    const r = await tx.onlinePaymentRequest.findUniqueOrThrow({ where: { id: found.id } });
    if (r.status === "PAID") return { resNum, status: "PAID" } as SettleOutcome;

    const fail = async (reason: string, status: "FAILED" | "PENDING" = "FAILED") => {
      // A cancelled attempt leaves the link usable until it expires; a bad verification closes it.
      await tx.onlinePaymentRequest.update({ where: { id: r.id }, data: { status, failureReason: reason } });
      return { resNum, status } as SettleOutcome;
    };

    const refNum = cb.RefNum?.trim();
    if (cb.Status !== "2" || !refNum) {
      return r.status === "PENDING" && r.expiresAt > now ? fail(`لغو یا ناموفق در درگاه (${cb.State ?? cb.Status ?? "?"})`, "PENDING") : { resNum, status: r.status as SettleOutcome["status"] };
    }

    const setting = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: r.gymId, key: SETTINGS_KEY } } });
    const terminalId = readSettings(setting?.value).terminalId;
    if (!terminalId) return fail("ترمینال تنظیم نشده");

    const used = await tx.onlinePaymentRequest.findUnique({ where: { refNum }, select: { id: true } });
    if (used) return fail("شماره مرجع تکراری");

    const v = await gateway.verify({ terminalId, refNum });
    if (!v.ok) return fail(`تأیید نشد: ${v.error ?? ""}`.slice(0, 200));
    if (v.amountRial !== r.amountRial) {
      await gateway.reverse({ terminalId, refNum });
      return fail("مبلغ تراکنش با مبلغ لینک یکسان نیست؛ تراکنش برگشت داده شد.");
    }

    await tx.$queryRaw`SELECT id FROM "member_subscription" WHERE id = ${r.subscriptionId}::uuid FOR UPDATE`;
    const { due } = await subscriptionBalance(tx, r.subscriptionId);
    if (r.amountRial > due) {
      // Paid at the counter meanwhile: never record more than the debt.
      const reversed = await gateway.reverse({ terminalId, refNum });
      return fail(reversed ? "بدهی در این فاصله تسویه شده بود؛ مبلغ به حساب پرداخت‌کننده برگشت داده شد." : "بدهی تسویه شده بود و برگشت خودکار انجام نشد؛ با پشتیبانی بانک تماس بگیرید.");
    }

    const payment = await tx.payment.create({
      data: {
        gymId: r.gymId,
        branchId: r.branchId,
        memberId: r.memberId,
        subscriptionId: r.subscriptionId,
        amountRial: r.amountRial,
        method: "ONLINE",
        reference: v.rrn ?? refNum,
        note: "پرداخت آنلاین (بانک سامان)",
        receivedByUserId: null,
        idempotencyKey: `online:${r.id}`,
        paidAt: now,
      },
    });
    await tx.ledgerEntry.create({
      data: {
        gymId: r.gymId, branchId: r.branchId, type: "INCOME", amountRial: payment.amountRial, method: "ONLINE",
        memberId: r.memberId, paymentId: payment.id, description: "پرداخت آنلاین اشتراک", createdByUserId: null, occurredAt: now,
      },
    });
    await tx.onlinePaymentRequest.update({
      where: { id: r.id },
      data: { status: "PAID", refNum, rrn: v.rrn ?? null, cardMask: v.cardMask ?? null, paymentId: payment.id, settledAt: now, failureReason: null },
    });
    await writeAudit(tx, {
      gymId: r.gymId, actorUserId: null, actorRole: null,
      action: "payment.online", entityType: "payment", entityId: payment.id,
      after: { resNum, refNum, amountRial: r.amountRial.toString(), gateway: gateway.name },
    });
    return { resNum, status: "PAID" } as SettleOutcome;
  });
}

/**
 * A member pays their own debt from the athlete app. The member is matched by verified phone
 * (never by a client-supplied gym id); the amount is always the full remaining debt, computed here.
 * Reuses a still-valid pending request for the same period instead of creating duplicates.
 */
export async function athleteStartDebtPayment(deps: CoreDeps, user: { id: string; phone: string }, memberId: string, subscriptionId: string) {
  const { getAthleteDashboardMember } = await import("../athlete");
  const m = await getAthleteDashboardMember(deps, user, memberId);
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const sub = await tx.memberSubscription.findFirst({ where: { id: subscriptionId, gymId: m.gymId, memberId: m.id, status: { not: "CANCELLED" } } });
    if (!sub) throw notFound("اشتراک");
    const setting = await tx.gymSetting.findUnique({ where: { gymId_key: { gymId: m.gymId, key: SETTINGS_KEY } } });
    if (!readSettings(setting?.value).terminalId) throw new AppError("BUSINESS_RULE", "پرداخت آنلاین در این باشگاه فعال نیست. لطفاً در پذیرش پرداخت کنید.");
    const { due } = await subscriptionBalance(tx, sub.id);
    if (due <= 0n) throw new AppError("BUSINESS_RULE", "این اشتراک بدهی ندارد.");
    if (due < MIN_ONLINE_RIAL) throw new AppError("BUSINESS_RULE", "مبلغ بدهی کمتر از حداقل پرداخت آنلاین است.");
    const existing = await tx.onlinePaymentRequest.findFirst({ where: { subscriptionId: sub.id, status: "PENDING", amountRial: due, expiresAt: { gt: new Date(now.getTime() + 3600_000) } } });
    if (existing) return { resNum: existing.resNum };
    const req = await tx.onlinePaymentRequest.create({
      data: {
        gymId: m.gymId, branchId: sub.branchId, memberId: m.id, subscriptionId: sub.id, amountRial: due,
        resNum: crypto.randomBytes(18).toString("base64url"), createdByUserId: user.id, expiresAt: new Date(now.getTime() + LINK_TTL_MS),
      },
    });
    await writeAudit(tx, { gymId: m.gymId, actorUserId: user.id, actorRole: "ATHLETE", action: "payment_link.self", entityType: "online_payment_request", entityId: req.id, after: { subscriptionId: sub.id, amountRial: due.toString() } });
    return { resNum: req.resNum };
  });
}
