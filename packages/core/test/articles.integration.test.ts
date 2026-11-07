/** Blog. Requires DATABASE_URL. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";
import { createPrismaClient, withSystem, type PrismaClient } from "@smartgym/db";
import { articleSchema } from "@smartgym/validation";
import {
  AppError, ConsoleSmsProvider, DEFAULT_CONFIG, type CoreDeps, requestOtp, verifyOtp,
  adminSaveArticle, adminListArticles, listPublishedArticles, getPublishedArticle, readMinutes,
} from "../src";

const hasDb = !!process.env.DATABASE_URL;
let db: PrismaClient;
let deps: CoreDeps;
const code = (c: AppError["code"]) => (e: unknown) => e instanceof AppError && e.code === c;

describe.skipIf(!hasDb)("articles", () => {
  let admin: { userId: string };
  let user: { userId: string };
  const slug = `test-${crypto.randomInt(1e9)}`;
  beforeAll(async () => {
    db = createPrismaClient(process.env.DATABASE_URL);
    const sms = new ConsoleSmsProvider();
    deps = { db, sms, config: { ...DEFAULT_CONFIG, otpPepper: "test-pepper-0123456789-0123456789", jwtSecret: "test-jwt-secret-0123456789-0123456789" } };
    const sign = async () => { const p = `+98912${crypto.randomInt(1_000_000, 9_999_999)}`; await requestOtp(deps, { phone: p, purpose: "LOGIN", ip: `10.1.${crypto.randomInt(250)}.${crypto.randomInt(250)}` }); return (await verifyOtp(deps, { phone: p, code: sms.sent.get(p)! })).user.id; };
    admin = { userId: await sign() };
    user = { userId: await sign() };
    await withSystem(db, (tx) => tx.user.update({ where: { id: admin.userId }, data: { isSuperAdmin: true } }));
  });
  afterAll(async () => db?.$disconnect());

  it("drafts are hidden; publishing stamps publishedAt once", async () => {
    const input = articleSchema.parse({ slug, title: "مقاله‌ی آزمایشی", excerpt: "خلاصه‌ی این مقاله برای تست", body: "کلمه ".repeat(400), status: "DRAFT", tags: ["مدیریت"] });
    await expect(adminSaveArticle(deps, user, null, input)).rejects.toSatisfy(code("FORBIDDEN"));
    const a = await adminSaveArticle(deps, admin, null, input);
    expect(a.readMinutes).toBe(readMinutes(input.body));
    await expect(getPublishedArticle(deps, slug)).rejects.toSatisfy(code("NOT_FOUND"));
    const p = await adminSaveArticle(deps, admin, a.id, { ...input, status: "PUBLISHED" });
    expect(p.publishedAt).toBeTruthy();
    const again = await adminSaveArticle(deps, admin, a.id, { ...input, status: "PUBLISHED", title: "عنوان تازه" });
    expect(again.publishedAt!.getTime()).toBe(p.publishedAt!.getTime());
    expect((await getPublishedArticle(deps, slug)).title).toBe("عنوان تازه");
    expect((await listPublishedArticles(deps, { page: 1, pageSize: 50, tag: "مدیریت" })).items.map((x) => x.slug)).toContain(slug);
    await expect(adminSaveArticle(deps, admin, null, input)).rejects.toSatisfy(code("CONFLICT"));
    await adminSaveArticle(deps, admin, a.id, { ...input, status: "ARCHIVED" });
    await expect(getPublishedArticle(deps, slug)).rejects.toSatisfy(code("NOT_FOUND"));
    expect((await adminListArticles(deps, admin)).find((x) => x.id === a.id)?.status).toBe("ARCHIVED");
  });
});
