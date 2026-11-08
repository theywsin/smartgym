/** Uploads, integrations (SMS key, online-payment switch) and admin gym/user detail. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createPrismaClient, withSystem, type PrismaClient } from "@smartgym/db";
import { adminGymUpdateSchema, integrationsSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, requestOtp, verifyOtp, registerGym,
  sniffImage, adminSaveUpload, adminListUploads, adminGetIntegrations, adminSetIntegrations, onlinePaymentsEnabled,
  adminGetGym, adminUpdateGym, adminGetUser, adminSetUserPassword, adminRevokeUserSessions, loginWithPassword, createSession,
} from "../src";

const hasDb = !!process.env.DATABASE_URL;
let db: PrismaClient;
let sms: ConsoleSmsProvider;
let deps: CoreDeps;
const phone = () => `+98912${crypto.randomInt(1_000_000, 9_999_999)}`;
const code = (c: AppError["code"]) => (e: unknown) => e instanceof AppError && e.code === c;
async function signIn(p: string) {
  await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: `10.${crypto.randomInt(250)}.${crypto.randomInt(250)}.${crypto.randomInt(250)}` });
  return verifyOtp(deps, { phone: p, code: sms.sent.get(p)! });
}
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

describe.skipIf(!hasDb)("platform tools", () => {
  let admin: { userId: string };
  let owner: { userId: string };
  let ownerPhone: string;
  let gymId: string;
  let before: Awaited<ReturnType<typeof adminGetIntegrations>>;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-up-"));

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const a = (await signIn(phone())).user.id;
    await withSystem(db, (tx) => tx.user.update({ where: { id: a }, data: { isSuperAdmin: true } }));
    admin = { userId: a };
    ownerPhone = phone();
    owner = { userId: (await signIn(ownerPhone)).user.id };
    gymId = (await registerGym(deps, owner.userId, { name: `باشگاه ابزار ${crypto.randomInt(1e6)}`, firstBranchName: "مرکزی" })).id;
    before = await adminGetIntegrations(deps, admin);
  });
  afterAll(async () => {
    await adminSetIntegrations(deps, admin, { sms: { provider: before.sms.provider, otpBodyId: before.sms.otpBodyId, expiryBodyId: before.sms.expiryBodyId }, payment: before.payment }).catch(() => undefined);
    fs.rmSync(dir, { recursive: true, force: true });
    await db?.$disconnect();
  });

  it("accepts real images only, stores them under a random name, admin only", async () => {
    expect(sniffImage(PNG)?.ext).toBe("png");
    expect(sniffImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    await expect(adminSaveUpload(deps, admin, new TextEncoder().encode("<script>"), dir)).rejects.toSatisfy(code("VALIDATION_FAILED"));
    await expect(adminSaveUpload(deps, owner, PNG, dir)).rejects.toSatisfy(code("FORBIDDEN"));
    const r = await adminSaveUpload(deps, admin, PNG, dir);
    expect(r.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(fs.readFileSync(path.join(dir, r.url.slice(9)))).toEqual(Buffer.from(PNG));
    expect((await adminListUploads(deps, admin)).some((u) => u.url === r.url)).toBe(true);
  });

  it("encrypts the SMS key, never returns it, keeps it when the field is blank", async () => {
    await expect(adminGetIntegrations(deps, owner)).rejects.toSatisfy(code("FORBIDDEN"));
    const key = "MELI-secret-key-1234567890abcd";
    const r = await adminSetIntegrations(deps, admin, integrationsSchema.parse({ sms: { provider: "melipayamak", melipayamakApiKey: key, otpBodyId: "12345", expiryBodyId: "" }, payment: { onlineEnabled: true } }));
    expect(r.sms.apiKeyMasked.endsWith("abcd")).toBe(true);
    expect(JSON.stringify(r)).not.toContain(key);
    const row = await withSystem(db, (tx) => tx.platformSetting.findUnique({ where: { key: "integrations" } }));
    expect(JSON.stringify(row?.value)).not.toContain(key);
    const audit = await withSystem(db, (tx) => tx.auditLog.findMany({ where: { action: "platform.integrations" }, orderBy: { createdAt: "desc" }, take: 1 }));
    expect(JSON.stringify(audit)).not.toContain(key);
    const again = await adminSetIntegrations(deps, admin, integrationsSchema.parse({ sms: { provider: "melipayamak", otpBodyId: "12345", expiryBodyId: "777" }, payment: { onlineEnabled: true } }));
    expect(again.sms.apiKeySet).toBe(true);
    expect(again.sms.expiryBodyId).toBe("777");
    await expect(adminSetIntegrations(deps, admin, integrationsSchema.parse({ sms: { provider: "melipayamak", otpBodyId: "", expiryBodyId: "" }, payment: { onlineEnabled: true } }))).rejects.toSatisfy(code("VALIDATION_FAILED"));
  });

  it("switches online payments off platform-wide", async () => {
    await adminSetIntegrations(deps, admin, { sms: { provider: "env", otpBodyId: "", expiryBodyId: "" }, payment: { onlineEnabled: false } });
    expect(await onlinePaymentsEnabled(deps)).toBe(false);
    await adminSetIntegrations(deps, admin, { sms: { provider: "env", otpBodyId: "", expiryBodyId: "" }, payment: { onlineEnabled: true } });
    expect(await onlinePaymentsEnabled(deps)).toBe(true);
  });

  it("shows any gym in full and edits its name and Saman terminal", async () => {
    await expect(adminGetGym(deps, owner, gymId)).rejects.toSatisfy(code("FORBIDDEN"));
    const g = await adminGetGym(deps, admin, gymId);
    expect(g.owner.id).toBe(owner.userId);
    expect(g.branches).toHaveLength(1);
    expect(g.staff.some((s) => s.userId === owner.userId)).toBe(true);
    expect(g.terminalId).toBeNull();
    const u = await adminUpdateGym(deps, admin, gymId, adminGymUpdateSchema.parse({ name: "نام جدید", terminalId: "۱۳۰۰۰۰۰۰" }));
    expect(u.name).toBe("نام جدید");
    expect(u.terminalId).toBe("13000000");
    expect(adminGymUpdateSchema.safeParse({ name: "x2", terminalId: "12" }).success).toBe(false);
  });

  it("shows any user and sets their password for phone + password login", async () => {
    await createSession(deps, { userId: owner.userId, kind: "WEB" });
    const u = await adminGetUser(deps, admin, owner.userId);
    expect(u.ownedGyms.map((g) => g.id)).toContain(gymId);
    expect(u.hasPassword).toBe(false);
    expect(u.sessions.length).toBeGreaterThan(0);
    await expect(adminSetUserPassword(deps, owner, owner.userId, "whatever-123")).rejects.toSatisfy(code("FORBIDDEN"));
    await adminSetUserPassword(deps, admin, owner.userId, "new-strong-pass-1");
    expect((await adminGetUser(deps, admin, owner.userId)).sessions).toHaveLength(0);
    expect((await loginWithPassword(deps, ownerPhone, "new-strong-pass-1")).id).toBe(owner.userId);
    await expect(loginWithPassword(deps, ownerPhone, "wrong-pass-0000")).rejects.toBeInstanceOf(AppError);
    expect((await adminRevokeUserSessions(deps, admin, owner.userId)).revoked).toBe(0);
  });

  it("uses the provider's own code when it generates one (Melipayamak OTP)", async () => {
    const p = phone();
    const own = { ...sms, name: "gen", createOtp: async () => ({ code: "4821" }), sendOtp: sms.sendOtp.bind(sms), sendTemplate: sms.sendTemplate.bind(sms), supports: () => true };
    const d = { ...deps, sms: own };
    await requestOtp(d, { phone: p, purpose: "LOGIN", ip: "10.99.1.1" });
    const r = await verifyOtp(d, { phone: p, code: "4821" });
    expect(r.user.phone).toBe(p);
  });

  it("returns the code for on-screen display only with the test (console) provider", async () => {
    const p1 = phone();
    const r1 = await requestOtp(deps, { phone: p1, purpose: "LOGIN", ip: "10.99.2.1" });
    expect(r1.devCode).toBe(sms.sent.get(p1));
    const real = { name: "real", sendOtp: async () => ({}), sendTemplate: async () => ({}), supports: () => false };
    const r2 = await requestOtp({ ...deps, sms: real }, { phone: phone(), purpose: "LOGIN", ip: "10.99.2.2" });
    expect("devCode" in r2).toBe(false);
  });

  it("outside production, shows the code on screen when the SMS provider fails", async () => {
    const broken = { name: "broken", createOtp: async () => { throw new Error("Melipayamak OTP failed (HTTP 401)"); }, sendOtp: async () => ({}), sendTemplate: async () => ({}), supports: () => false };
    const p = phone();
    const r = await requestOtp({ ...deps, sms: broken }, { phone: p, purpose: "LOGIN", ip: "10.99.3.1" });
    expect(r.devCode).toMatch(/^\d{6}$/);
    expect((await verifyOtp(deps, { phone: p, code: r.devCode! })).user.phone).toBe(p);
  });
});
