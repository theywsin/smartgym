/** Phase 3: pay-by-link through the bank gateway (sandbox and mocked Saman). Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withTenant, type PrismaClient } from "@smartgym/db";
import { memberInputSchema, membershipPlanSchema, recordPaymentSchema, sellMembershipSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext, type PaymentGateway,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, getMember, createMembershipPlan, sellMembership, recordPayment,
  SandboxGateway, SamanGateway, setOnlinePaymentSettings, getOnlinePaymentSettings,
  createPaymentLink, getPublicPayment, startOnlinePayment, settleGatewayCallback, listPaymentLinks,
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

const sandbox = new SandboxGateway("sandbox-secret-0123456789-0123456789", "http://localhost:3001");
const CB = "http://localhost:3001/api/v1/payments/saman/callback";

/** Drives the sandbox like a browser: start, then "pay" on the fake bank page. */
async function payViaSandbox(resNum: string) {
  const { redirectUrl } = await startOnlinePayment(deps, sandbox, resNum, CB);
  const token = new URL(redirectUrl).searchParams.get("token")!;
  return { refNum: sandbox.refNumFor(token)!, token };
}

describe.skipIf(!hasDb)("online payments", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let other: TenantContext;
  let planId: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه آنلاین", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "دیگری", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    const branch = (await listBranches(deps, owner))[0]!.id;
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch] })).userId, gym.id);
    planId = (await createMembershipPlan(deps, owner, membershipPlanSchema.parse({ name: "ماهانه", durationDays: 30, priceAmountRial: 20_000_000 }))).id;
  });
  afterAll(async () => db?.$disconnect());

  const newSale = async () => {
    const m = await createMember(deps, reception, memberInputSchema.parse({ firstName: "آنلاین", lastName: "پرداز", phone: `0912${crypto.randomInt(1_000_000, 9_999_999)}` }));
    const s = await sellMembership(deps, reception, sellMembershipSchema.parse({ memberId: m.id, planId }));
    return { m, s };
  };

  it("needs a terminal before links, and only the owner can set it", async () => {
    const { s } = await newSale();
    await expectCode(createPaymentLink(deps, reception, { subscriptionId: s.id }), "BUSINESS_RULE");
    await expectCode(setOnlinePaymentSettings(deps, reception, { terminalId: "13000000" }), "FORBIDDEN");
    await setOnlinePaymentSettings(deps, owner, { terminalId: "13000000" });
    expect(await getOnlinePaymentSettings(deps, owner)).toEqual({ terminalId: "13000000" });
  });

  it("pays a debt end to end and records an ONLINE payment and ledger row", async () => {
    const { m, s } = await newSale();
    const link = await createPaymentLink(deps, reception, { subscriptionId: s.id });
    expect(link.amountRial).toBe(20_000_000n);
    expect(link.resNum).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(await getPublicPayment(deps, link.resNum)).toMatchObject({ status: "PENDING", gymName: "باشگاه آنلاین", memberFirstName: "آنلاین" });

    const { refNum } = await payViaSandbox(link.resNum);
    expect(await settleGatewayCallback(deps, sandbox, { ResNum: link.resNum, RefNum: refNum, Status: "2" })).toEqual({ resNum: link.resNum, status: "PAID" });

    const d = await getMember(deps, owner, m.id);
    expect(d.subscriptions[0]!.dueAmountRial).toBe(0n);
    const rows = await withTenant(db, owner, async (tx) => ({
      payments: await tx.payment.findMany({ where: { subscriptionId: s.id } }),
      ledger: await tx.ledgerEntry.findMany({ where: { memberId: m.id } }),
    }));
    expect(rows.payments).toHaveLength(1);
    expect(rows.payments[0]).toMatchObject({ method: "ONLINE", amountRial: 20_000_000n, receivedByUserId: null });
    expect(rows.ledger).toHaveLength(1);
    expect((await listPaymentLinks(deps, owner, m.id))[0]!.status).toBe("PAID");

    // Replayed callback: no second payment.
    expect((await settleGatewayCallback(deps, sandbox, { ResNum: link.resNum, RefNum: refNum, Status: "2" })).status).toBe("PAID");
    const again = await withTenant(db, owner, (tx) => tx.payment.count({ where: { subscriptionId: s.id } }));
    expect(again).toBe(1);
    await expectCode(startOnlinePayment(deps, sandbox, link.resNum, CB), "CONFLICT");
  });

  it("ignores a forged success callback that the bank does not verify", async () => {
    const { s } = await newSale();
    const link = await createPaymentLink(deps, reception, { subscriptionId: s.id });
    const out = await settleGatewayCallback(deps, sandbox, { ResNum: link.resNum, RefNum: "FAKE.ref.abc", Status: "2" });
    expect(out.status).toBe("FAILED");
    expect(await withTenant(db, owner, (tx) => tx.payment.count({ where: { subscriptionId: s.id } }))).toBe(0);
  });

  it("refuses to reuse one bank RefNum for another link", async () => {
    const a = await createPaymentLink(deps, reception, { subscriptionId: (await newSale()).s.id });
    const b = await createPaymentLink(deps, reception, { subscriptionId: (await newSale()).s.id });
    const { refNum } = await payViaSandbox(a.resNum);
    expect((await settleGatewayCallback(deps, sandbox, { ResNum: a.resNum, RefNum: refNum, Status: "2" })).status).toBe("PAID");
    expect((await settleGatewayCallback(deps, sandbox, { ResNum: b.resNum, RefNum: refNum, Status: "2" })).status).toBe("FAILED");
  });

  it("reverses when the verified amount differs from the link amount", async () => {
    const { s } = await newSale();
    const link = await createPaymentLink(deps, reception, { subscriptionId: s.id, amountRial: 5_000_000n });
    const reverse = vi.fn(async () => true);
    const tampered: PaymentGateway = { name: "test", requestToken: sandbox.requestToken.bind(sandbox), verify: async () => ({ ok: true, amountRial: 10_000n }), reverse };
    const out = await settleGatewayCallback(deps, tampered, { ResNum: link.resNum, RefNum: "R-tamper-1", Status: "2" });
    expect(out.status).toBe("FAILED");
    expect(reverse).toHaveBeenCalledOnce();
    expect(await withTenant(db, owner, (tx) => tx.payment.count({ where: { subscriptionId: s.id } }))).toBe(0);
  });

  it("reverses when the debt was settled at the counter in the meantime", async () => {
    const { s } = await newSale();
    const link = await createPaymentLink(deps, reception, { subscriptionId: s.id });
    const { refNum } = await payViaSandbox(link.resNum);
    await recordPayment(deps, reception, recordPaymentSchema.parse({ subscriptionId: s.id, amountRial: 20_000_000, method: "CASH" }));
    const spy = vi.spyOn(sandbox, "reverse");
    expect((await settleGatewayCallback(deps, sandbox, { ResNum: link.resNum, RefNum: refNum, Status: "2" })).status).toBe("FAILED");
    expect(spy).toHaveBeenCalledOnce();
    expect(await withTenant(db, owner, (tx) => tx.payment.count({ where: { subscriptionId: s.id } }))).toBe(1);
  });

  it("keeps the link usable after a cancelled attempt, and rejects amounts over the debt", async () => {
    const { s } = await newSale();
    await expectCode(createPaymentLink(deps, reception, { subscriptionId: s.id, amountRial: 20_000_001n }), "VALIDATION_FAILED");
    const link = await createPaymentLink(deps, reception, { subscriptionId: s.id });
    expect((await settleGatewayCallback(deps, sandbox, { ResNum: link.resNum, Status: "1", State: "CanceledByUser" })).status).toBe("PENDING");
    expect((await getPublicPayment(deps, link.resNum)).status).toBe("PENDING");
  });

  it("expires links and isolates tenants", async () => {
    const { m, s } = await newSale();
    const link = await createPaymentLink(deps, reception, { subscriptionId: s.id });
    const later: CoreDeps = { ...deps, now: () => new Date(Date.now() + 4 * 86_400_000) };
    expect((await getPublicPayment(later, link.resNum)).status).toBe("EXPIRED");
    await expectCode(startOnlinePayment(later, sandbox, link.resNum, CB), "BUSINESS_RULE");
    await expectCode(createPaymentLink(deps, other, { subscriptionId: s.id }), "NOT_FOUND");
    await expectCode(listPaymentLinks(deps, other, m.id), "NOT_FOUND");
    expect(await withTenant(db, other, (tx) => tx.onlinePaymentRequest.count({ where: { id: { not: crypto.randomUUID() } } }))).toBe(0);
  });
});

describe("Saman SEP adapter", () => {
  it("requests a token, verifies and reverses with the documented payloads", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const replies = [
      { status: 1, token: "tok123" },
      { ResultCode: 0, Success: true, TransactionDetail: { RRN: "14000", MaskedPan: "6037-99**-****-1234", AffectiveAmount: 5_000_000 } },
      { ResultCode: 0, Success: true },
    ];
    const fetchFn = async (url: string, init: { body: string }) => {
      calls.push({ url, body: JSON.parse(init.body) });
      const r = replies.shift();
      return { ok: true, status: 200, json: async () => r };
    };
    const gw = new SamanGateway(fetchFn);
    const t = await gw.requestToken({ terminalId: "13000000", amountRial: 5_000_000n, resNum: "abc", callbackUrl: CB, cellNumber: "09121112233" });
    expect(t.redirectUrl).toBe("https://sep.shaparak.ir/OnlinePG/SendToken?token=tok123");
    expect(calls[0]).toEqual({ url: "https://sep.shaparak.ir/onlinepg/onlinepg", body: { action: "token", TerminalId: "13000000", Amount: 5_000_000, ResNum: "abc", RedirectUrl: CB, CellNumber: "09121112233" } });
    expect(await gw.verify({ terminalId: "13000000", refNum: "R1" })).toEqual({ ok: true, amountRial: 5_000_000n, rrn: "14000", cardMask: "6037-99**-****-1234" });
    expect(calls[1]!.body).toEqual({ RefNum: "R1", TerminalNumber: 13000000 });
    expect(await gw.reverse({ terminalId: "13000000", refNum: "R1" })).toBe(true);
    expect(calls[2]!.url).toContain("/ReverseTransaction");
  });

  it("treats a failed token or verification as an error", async () => {
    const gw = new SamanGateway(async () => ({ ok: true, status: 200, json: async () => ({ status: -1, errorCode: 5, errorDesc: "bad" }) }));
    await expect(gw.requestToken({ terminalId: "1", amountRial: 10_000n, resNum: "x", callbackUrl: CB })).rejects.toThrow(/token error/);
    const gw2 = new SamanGateway(async () => ({ ok: true, status: 200, json: async () => ({ ResultCode: -2, Success: false }) }));
    expect((await gw2.verify({ terminalId: "1", refNum: "R" })).ok).toBe(false);
  });
});
