/** Phase 4: background jobs (expiry reminders, link expiry). Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { memberInputSchema, membershipPlanSchema, sellMembershipSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, getMember, createMembershipPlan, sellMembership,
  setMemberArchived,
  runExpiryReminders, setReminderSettings, getReminderSettings, listMemberNotifications, MelipayamakSmsProvider, KavenegarSmsProvider, SmsTemplateNotConfigured, type SmsProvider,
} from "../src";

const hasDb = !!process.env.DATABASE_URL;
let db: PrismaClient;
let sms: ConsoleSmsProvider;
let deps: CoreDeps;
const phone = () => `+98912${crypto.randomInt(1_000_000, 9_999_999)}`;
async function signIn(p: string) {
  await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: `10.${crypto.randomInt(250)}.${crypto.randomInt(250)}.${crypto.randomInt(250)}` });
  return verifyOtp(deps, { phone: p, code: sms.sent.get(p)! });
}
async function expectCode(promise: Promise<unknown>, code: AppError["code"]) {
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

const DAY = 86_400_000;

describe("SMS templates", () => {
  it("melipayamak sends the configured bodyId with args and refuses unknown templates", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const f = (async (url: string, init: { body: string }) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ recId: 123456789, status: "ok" }), { status: 200 });
    }) as unknown as typeof fetch;
    const p = new MelipayamakSmsProvider("KEY", 111, f, { MEMBERSHIP_EXPIRY: 222 });
    expect(p.supports("MEMBERSHIP_EXPIRY")).toBe(true);
    await p.sendTemplate("+989121234567", "MEMBERSHIP_EXPIRY", ["رضا", "باشگاه", "۳"]);
    expect(calls[0]!.body).toEqual({ bodyId: 222, to: "09121234567", args: ["رضا", "باشگاه", "۳"] });
    const bare = new MelipayamakSmsProvider("KEY", 111, f);
    expect(bare.supports("MEMBERSHIP_EXPIRY")).toBe(false);
    await expect(bare.sendTemplate("+989121234567", "MEMBERSHIP_EXPIRY", [])).rejects.toBeInstanceOf(SmsTemplateNotConfigured);
  });

  it("kavenegar maps args to token, token2, token3 without spaces", async () => {
    let url = "";
    const f = (async (u: URL) => {
      url = u.toString();
      return new Response(JSON.stringify({ return: { status: 200 }, entries: [{ messageid: 9 }] }), { status: 200 });
    }) as unknown as typeof fetch;
    await new KavenegarSmsProvider("K", "otp", f, { MEMBERSHIP_EXPIRY: "expiry" }).sendTemplate("+989121234567", "MEMBERSHIP_EXPIRY", ["رضا", "باشگاه آرین", "۳"]);
    const q = new URL(url).searchParams;
    expect([q.get("template"), q.get("token"), q.get("token2"), q.get("token3")]).toEqual(["expiry", "رضا", "باشگاه‌آرین", "۳"]);
  });
});

describe.skipIf(!hasDb)("expiry reminders", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let gymId: string;
  let plan: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    gymId = (await registerGym(deps, ownerId, { name: "باشگاه یادآور", firstBranchName: "مرکزی" })).id;
    owner = await loadTenantContext(db, ownerId, gymId);
    const branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gymId);
    plan = (await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ده روزه", durationDays: 10, priceAmountRial: 1_000_000 }))).id;
  });
  afterAll(async () => db?.$disconnect());

  const mobile = () => `0912${crypto.randomInt(1_000_000, 9_999_999)}`;
  const sold = async (opts: { phone?: string | null } = {}) => {
    const m = await createMember(deps, reception, memberInputSchema.parse({ firstName: "یادآور", lastName: "تست", ...(opts.phone !== null && { phone: opts.phone ?? mobile() }) }));
    const s = await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m.id, planId: plan, payment: { amountRial: 1_000_000, method: "CASH" } }));
    return { m, s };
  };
  /** Runs the job as if it were `days` before the subscription ends. */
  const at = (endsAt: Date, daysBefore: number): CoreDeps => ({ ...deps, now: () => new Date(endsAt.getTime() - daysBefore * DAY) });

  it("sends exactly once per period, in the window only, and skips renewed, archived and phoneless members", async () => {
    const a = await sold();
    const renewed = await sold();
    await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: renewed.m.id, planId: plan }));
    const archived = await sold();
    await setMemberArchived(deps, owner, archived.m.id, true);
    const noPhone = await sold({ phone: null });
    const end = new Date(a.s.endsAt);
    const before = sms.templates.length;

    await runExpiryReminders(at(end, 5)); // outside the default 3-day window
    const logsEarly = await withTenant(db, owner, (tx) => tx.notificationLog.count({ where: { memberId: a.m.id } }));
    expect(logsEarly).toBe(0);

    const runs = await Promise.all([runExpiryReminders(at(end, 2)), runExpiryReminders(at(end, 2)), runExpiryReminders(at(end, 1))]);
    expect(runs.reduce((n, r) => n + r.sent, 0)).toBeGreaterThanOrEqual(1);
    const logs = await withTenant(db, owner, (tx) => tx.notificationLog.findMany({ where: { gymId } }));
    expect(logs.filter((l) => l.memberId === a.m.id)).toHaveLength(1);
    expect(logs.filter((l) => l.memberId === a.m.id)[0]!.status).toBe("SENT");
    for (const skip of [renewed.m.id, archived.m.id, noPhone.m.id]) expect(logs.some((l) => l.memberId === skip)).toBe(false);
    const sent = sms.templates.slice(before).filter((t) => t.args[1] === "باشگاه یادآور");
    expect(sent.length).toBe(logs.length);
    expect(sent[0]!.args[2]).toMatch(/^[۱۲]$/);
    expect((await listMemberNotifications(deps, reception, a.m.id))[0]!.kind).toBe("membership_expiry");
  });

  it("respects the gym setting and reports when the template is missing", async () => {
    await expectCode(setReminderSettings(deps, reception, { enabled: false, daysBefore: 3 }), "FORBIDDEN");
    await setReminderSettings(deps, owner, { enabled: false, daysBefore: 7 });
    expect(await getReminderSettings(deps, owner)).toMatchObject({ enabled: false, daysBefore: 7, smsConfigured: true });
    const b = await sold();
    await runExpiryReminders(at(new Date(b.s.endsAt), 1));
    expect(await withTenant(db, owner, (tx) => tx.notificationLog.count({ where: { memberId: b.m.id } }))).toBe(0);

    await setReminderSettings(deps, owner, { enabled: true, daysBefore: 7 });
    const noTemplate: SmsProvider = { ...sms, name: "x", sendOtp: sms.sendOtp.bind(sms), sendTemplate: sms.sendTemplate.bind(sms), supports: () => false };
    expect(await runExpiryReminders({ ...at(new Date(b.s.endsAt), 6), sms: noTemplate })).toMatchObject({ skippedNoTemplate: true, sent: 0 });
    await runExpiryReminders(at(new Date(b.s.endsAt), 6));
    expect(await withTenant(db, owner, (tx) => tx.notificationLog.count({ where: { memberId: b.m.id, status: "SENT" } }))).toBe(1);
  });

  it("records a failed send without retrying it", async () => {
    const c = await sold();
    const failing: SmsProvider = { name: "fail", sendOtp: async () => ({}), supports: () => true, sendTemplate: async () => { throw new Error("provider down"); } };
    const r = await runExpiryReminders({ ...at(new Date(c.s.endsAt), 1), sms: failing });
    expect(r.failed).toBeGreaterThanOrEqual(1);
    const log = await withTenant(db, owner, (tx) => tx.notificationLog.findFirstOrThrow({ where: { memberId: c.m.id } }));
    expect(log).toMatchObject({ status: "FAILED", error: expect.stringContaining("provider down") });
    await runExpiryReminders(at(new Date(c.s.endsAt), 1));
    expect(await withTenant(db, owner, (tx) => tx.notificationLog.count({ where: { memberId: c.m.id } }))).toBe(1);
  });
});
