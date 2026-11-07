/** Phase 2 part 2: member notes, coaches, CSV import/export. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withSystem, withTenant, type PrismaClient } from "@smartgym/db";
import { listMembersSchema, memberInputSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, type TenantContext,
  requestOtp, verifyOtp, registerGym, loadTenantContext, listBranches, inviteStaff,
  createMember, getMember, listMembers, addMemberNote, listMemberNotes,
  listCoaches, updateCoach, assignCoach, exportMembersCsv, importMembersCsv,
} from "../src";
import { parseCsv, toCsv } from "../src/members/csv";

const hasDb = !!process.env.DATABASE_URL;
let db: PrismaClient;
let sms: ConsoleSmsProvider;
let deps: CoreDeps;

const phone = () => `+98912${crypto.randomInt(1_000_000, 9_999_999)}`;
const local = (e164: string) => `0${e164.slice(3)}`;
async function signIn(p: string) {
  await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: `10.${crypto.randomInt(250)}.${crypto.randomInt(250)}.${crypto.randomInt(250)}` });
  return verifyOtp(deps, { phone: p, code: sms.sent.get(p)! });
}
async function expectCode(promise: Promise<unknown>, code: AppError["code"]) {
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

describe("csv helpers", () => {
  it("parses quotes, escaped quotes, CRLF, BOM and semicolon files", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
    expect(parseCsv("نام;یادداشت\nعلی;a,b\n\n")).toEqual([["نام", "یادداشت"], ["علی", "a,b"]]);
  });
  it("neutralises spreadsheet formulas on export", () => {
    expect(toCsv([["=HYPERLINK(1)", "+98", "ok"]])).toBe('﻿"\'=HYPERLINK(1)","\'+98","ok"\r\n');
  });
});

describe.skipIf(!hasDb)("notes, coaches, import/export", () => {
  let owner: TenantContext;
  let reception: TenantContext;
  let other: TenantContext;
  let coachId: string;
  let otherCoachId: string;
  let branch1: string;

  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const ownerId = (await signIn(phone())).user.id;
    const otherId = (await signIn(phone())).user.id;
    const gym = await registerGym(deps, ownerId, { name: "باشگاه مربیان", firstBranchName: "مرکزی" });
    const gym2 = await registerGym(deps, otherId, { name: "باشگاه دیگر", firstBranchName: "اصلی" });
    owner = await loadTenantContext(db, ownerId, gym.id);
    other = await loadTenantContext(db, otherId, gym2.id);
    branch1 = (await listBranches(deps, owner))[0]!.id;
    await withSystem(db, (tx) => tx.branch.create({ data: { gymId: gym.id, name: "غرب" } }));
    coachId = (await inviteStaff(deps, owner, { phone: phone(), role: "COACH", branchIds: [], firstName: "کاوه", lastName: "نیک‌پور" })).userId;
    otherCoachId = (await inviteStaff(deps, other, { phone: phone(), role: "COACH", branchIds: [] })).userId;
    const rec = await inviteStaff(deps, owner, { phone: phone(), role: "RECEPTIONIST", branchIds: [branch1] });
    reception = await loadTenantContext(db, rec.userId, gym.id);
  });
  afterAll(async () => db?.$disconnect());

  it("keeps notes append-only and scoped to the gym", async () => {
    const m = await createMember(deps, owner, memberInputSchema.parse({ firstName: "یادداشت", lastName: "دار" }));
    await addMemberNote(deps, reception, m.id, "پرداخت قسط دوم ۱۵ آذر");
    const notes = await listMemberNotes(deps, owner, m.id);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.body).toContain("قسط");
    await expectCode(listMemberNotes(deps, other, m.id), "NOT_FOUND");
    await expect(withTenant(db, owner, (tx) => tx.memberNote.deleteMany({ where: { memberId: m.id } }))).rejects.toThrow();
  });

  it("lists coaches, edits their profile and assigns them to members with history", async () => {
    const coaches = await listCoaches(deps, owner);
    expect(coaches.map((c) => c.userId)).toEqual([coachId]);
    await updateCoach(deps, owner, coachId, { specializations: ["بدنسازی", "TRX", "بدنسازی"], commissionRateBp: 2000 });
    await expectCode(updateCoach(deps, owner, otherCoachId, { bio: "x" }), "NOT_FOUND");
    await expectCode(updateCoach(deps, reception, coachId, { bio: "x" }), "FORBIDDEN");

    const m = await createMember(deps, owner, memberInputSchema.parse({ firstName: "شاگرد", lastName: "اول" }));
    await expectCode(assignCoach(deps, owner, m.id, otherCoachId), "VALIDATION_FAILED");
    await assignCoach(deps, owner, m.id, coachId);
    const detail = await getMember(deps, owner, m.id);
    expect(detail.coach).toEqual({ userId: coachId, name: "کاوه نیک‌پور" });
    const list = await listMembers(deps, owner, listMembersSchema.parse({ coachUserId: coachId }));
    expect(list.items.map((i) => i.id)).toEqual([m.id]);
    const after = await listCoaches(deps, owner);
    expect(after[0]).toMatchObject({ specializations: ["بدنسازی", "TRX"], commissionRateBp: 2000, activeAthletes: 1 });

    await assignCoach(deps, owner, m.id, null);
    expect((await getMember(deps, owner, m.id)).coach).toBeNull();
    const history = await withTenant(db, owner, (tx) => tx.coachAthlete.findMany({ where: { memberId: m.id } }));
    expect(history).toHaveLength(1);
    expect(history[0]!.endedAt).not.toBeNull();
  });

  it("validates the whole import file and writes nothing when any row is wrong", async () => {
    const taken = phone();
    await createMember(deps, owner, memberInputSchema.parse({ firstName: "قبلی", lastName: "ثبت", phone: taken }));
    const dup = phone();
    const csv = [
      "نام,نام خانوادگی,موبایل,جنسیت,تاریخ تولد,کد ملی,شعبه",
      `سارا,محمدی,${local(dup)},زن,۱۳۷۵/۰۲/۱۰,0499370899,مرکزی`,
      `,بی‌نام,,,,,`,
      `امیر,جعفری,${local(dup)},نامشخص,1404/12/30,123,شعبه ناموجود`,
      `قدیمی,تکراری,${local(taken)},,,,`,
    ].join("\n");
    const before = (await listMembers(deps, owner, listMembersSchema.parse({}))).counts.all;
    const report = await importMembersCsv(deps, owner, csv, { dryRun: false });
    expect(report.imported).toBe(0);
    const byRow = (r: number) => report.errors.filter((e) => e.row === r).map((e) => e.field);
    expect(byRow(2)).toEqual([]);
    expect(byRow(3)).toEqual(["نام"]);
    expect(byRow(4)).toEqual(expect.arrayContaining(["جنسیت", "تاریخ تولد", "شعبه", "کد ملی"]));
    expect(byRow(5)).toEqual(["موبایل"]);
    expect((await listMembers(deps, owner, listMembersSchema.parse({}))).counts.all).toBe(before);
  });

  it("imports a clean file with sequential member numbers, then exports it", async () => {
    const p1 = phone();
    const csv = `first name;last name;mobile;branch\nنیما;کریمی;${local(p1)};غرب\nلیلا;شاکری;;\n`;
    const dry = await importMembersCsv(deps, owner, csv, { dryRun: true });
    expect(dry).toMatchObject({ imported: 0, totalRows: 2, errors: [] });
    const done = await importMembersCsv(deps, owner, csv, { dryRun: false });
    expect(done.imported).toBe(2);
    // Arabic yeh/kaf from Windows-1256 files are stored as Persian letters and found by either spelling.
    await importMembersCsv(deps, owner, "نام,نام خانوادگی\nكيان,يزدي\n", { dryRun: false });
    expect((await listMembers(deps, owner, listMembersSchema.parse({ q: "کیان یزدی" }))).items).toHaveLength(1);
    expect((await listMembers(deps, owner, listMembersSchema.parse({ q: "كيان" }))).items[0]!.firstName).toBe("کیان");
    const found = await listMembers(deps, owner, listMembersSchema.parse({ q: "نیما کریمی" }));
    expect(found.items[0]!.phone).toBe(p1);

    const out = await exportMembersCsv(deps, owner);
    const table = parseCsv(out.csv);
    expect(table[0]![0]).toBe("کد عضویت");
    const row = table.find((r) => r[1] === "نیما")!;
    expect(row[3]).toBe(local(p1));
    expect(row[7]).toBe("غرب");
    const codes = table.slice(1).map((r) => Number(r[0]));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("restricts export to managers and import to the user's branches", async () => {
    await expectCode(exportMembersCsv(deps, reception), "FORBIDDEN");
    const r = await importMembersCsv(deps, reception, "نام,نام خانوادگی,شعبه\nالف,ب,غرب\nج,د,\n", { dryRun: true });
    expect(r.errors).toEqual([{ row: 2, field: "شعبه", message: "به این شعبه دسترسی ندارید." }]);
  });
});
