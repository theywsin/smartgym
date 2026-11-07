/** Support tickets. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withSystem, type PrismaClient } from "@smartgym/db";
import { memberInputSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, inviteStaff, createMember, listBranches,
  staffListTickets, staffOpenPlatformTicket, staffGetTicket, staffReplyTicket, staffCloseTicket,
  athleteListTickets, athleteOpenTicket, athleteGetTicket, athleteReplyTicket,
  adminListTickets, adminReplyTicket, adminGetTicket, adminCloseTicket,
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
const code = (c: AppError["code"]) => (e: unknown) => e instanceof AppError && e.code === c;

describe.skipIf(!hasDb)("tickets", () => {
  let owner: TenantContext;
  let other: TenantContext;
  let reception: TenantContext;
  let athlete: { id: string; phone: string };
  let memberId: string;
  let admin: { userId: string };

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const o = (await signIn(phone())).user.id;
    const g = await registerGym(deps, o, { name: "باشگاه تیکت", firstBranchName: "مرکزی" });
    owner = await loadTenantContext(db, o, g.id);
    const o2 = (await signIn(phone())).user.id;
    other = await loadTenantContext(db, o2, (await registerGym(deps, o2, { name: "دیگر", firstBranchName: "x" })).id);
    reception = await loadTenantContext(db, (await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [(await listBranches(deps, owner))[0]!.id] })).userId, g.id);
    const ap = phone();
    memberId = (await createMember(deps, owner, memberInputSchema.parse({ firstName: "نگار", lastName: "امینی", phone: ap }))).id;
    athlete = (await signIn(ap)).user;
    const a = (await signIn(phone())).user.id;
    await withSystem(db, (tx) => tx.user.update({ where: { id: a }, data: { isSuperAdmin: true } }));
    admin = { userId: a };
  });
  afterAll(async () => db?.$disconnect());

  it("member ↔ gym conversation with status changes", async () => {
    await expect(athleteOpenTicket(deps, athlete, memberId, { subject: "سؤال", category: "نامعتبر", body: "سلام" })).rejects.toSatisfy(code("VALIDATION_FAILED"));
    const { id } = await athleteOpenTicket(deps, athlete, memberId, { subject: "تمدید اشتراک", category: "اشتراک و تمدید", body: "کی تمدید کنم؟" });
    await expect(staffListTickets(deps, reception, { scope: "GYM" })).rejects.toSatisfy(code("FORBIDDEN"));
    expect((await staffListTickets(deps, other, { scope: "GYM" })).map((t) => t.id)).not.toContain(id);
    await expect(staffGetTicket(deps, other, id)).rejects.toSatisfy(code("NOT_FOUND"));
    const list = await staffListTickets(deps, owner, { scope: "GYM", status: "OPEN" });
    expect(list.find((t) => t.id === id)?.memberName).toBe("نگار امینی");
    expect((await staffReplyTicket(deps, owner, id, "هر وقت خواستید")).status).toBe("ANSWERED");
    expect((await athleteReplyTicket(deps, athlete, memberId, id, "ممنون")).messages.map((m) => m.side)).toEqual(["REQUESTER", "SUPPORT", "REQUESTER"]);
    await staffCloseTicket(deps, owner, id);
    await expect(staffReplyTicket(deps, owner, id, "x")).rejects.toSatisfy(code("BUSINESS_RULE"));
    expect((await athleteReplyTicket(deps, athlete, memberId, id, "یک سؤال دیگر")).status).toBe("OPEN");
    expect((await athleteListTickets(deps, athlete, memberId))[0]!.id).toBe(id);
    const stranger = (await signIn(phone())).user;
    await expect(athleteGetTicket(deps, stranger, memberId, id)).rejects.toSatisfy(code("NOT_FOUND"));
  });

  it("gym ↔ platform support", async () => {
    const { id } = await staffOpenPlatformTicket(deps, owner, { subject: "مشکل درگاه", category: "فنی", body: "پرداخت آنلاین خطا می‌دهد" });
    await expect(adminListTickets(deps, { userId: owner.userId })).rejects.toSatisfy(code("FORBIDDEN"));
    expect((await adminListTickets(deps, admin, "OPEN")).map((t) => t.id)).toContain(id);
    expect((await adminReplyTicket(deps, admin, id, "بررسی شد")).status).toBe("ANSWERED");
    expect((await staffReplyTicket(deps, owner, id, "حل شد")).status).toBe("OPEN");
    await adminCloseTicket(deps, admin, id);
    expect((await adminGetTicket(deps, admin, id)).status).toBe("CLOSED");
    expect((await staffListTickets(deps, owner, { scope: "PLATFORM" }))[0]!.id).toBe(id);
  });
});
