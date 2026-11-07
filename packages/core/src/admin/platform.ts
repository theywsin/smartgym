import { withSystem, type Prisma, type Tx } from "@smartgym/db";
import {
  PLATFORM_SETTING_SCHEMAS, type AdminAuditListInput, type AdminPlanInput, type AdminUserListInput,
  type PlatformSettingKey, type PlatformSettings,
} from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import type { CoreDeps } from "../deps";
import { writeAudit } from "../audit";
import type { AdminActor } from "./index";

async function requireSuperAdmin(tx: Tx, actor: AdminActor) {
  const u = await tx.user.findUnique({ where: { id: actor.userId }, select: { isSuperAdmin: true, status: true } });
  if (!u?.isSuperAdmin || u.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این بخش فقط برای مدیر پلتفرم است.");
}
const audit = (tx: Tx, actor: AdminActor, action: string, entityType: string, entityId: string | null, before: unknown, after: unknown) =>
  writeAudit(tx, {
    actorUserId: actor.userId, actorRole: "SUPER_ADMIN", action, entityType, entityId,
    before: before as Prisma.InputJsonValue, after: after as Prisma.InputJsonValue, ip: actor.ip, userAgent: actor.userAgent,
  });

// ---------- Platform settings ----------

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  site: {
    name: "اسمارت‌جیم", tagline: "نرم‌افزار ابری مدیریت باشگاه ورزشی", supportPhone: "", supportEmail: "", address: "", instagram: "", telegram: "",
  },
  landing: {
    heroTitle: "باشگاهتان را هوشمند مدیریت کنید",
    heroSubtitle: "عضویت، حضور و غیاب با QR، صندوق و بدهی، فروشگاه و بوفه، پرتال مربی و اپ ورزشکار؛ همه در یک پنل فارسی و ابری.",
    ctaText: "شروع رایگان",
    features: [
      { title: "عضویت و تمدید", body: "پلن‌های زمانی و جلسه‌ای، تمدید از پایان دوره، تعلیق و یادآوری پیامکی پیش از پایان اشتراک." },
      { title: "حضور با QR", body: "ورزشکار کد ورود را از گوشی نشان می‌دهد؛ پذیرش با بارکدخوان یا دوربین ثبت می‌کند." },
      { title: "صندوق و بدهی", body: "پرداخت نقد، کارتخوان و آنلاین (درگاه سامان)، بدهی، بازگشت وجه و گزارش سود و زیان ماهانه." },
      { title: "فروشگاه و بوفه", body: "فروش سریع، موجودی هر شعبه و ابطال با برگشت موجودی." },
      { title: "پرتال مربی", body: "مربی برنامه‌ی تمرینی شاگردانش را می‌نویسد و کمیسیونش محاسبه می‌شود." },
      { title: "چند شعبه و نقش‌ها", body: "دسترسی دقیق برای مدیر، پذیرش، حسابدار، مربی و مسئول فروشگاه در هر شعبه." },
    ],
    faq: [
      { q: "دوره‌ی آزمایشی رایگان است؟", a: "بله. بدون نیاز به کارت بانکی ثبت‌نام کنید و همه‌ی امکانات پلن پایه را امتحان کنید." },
      { q: "اطلاعات باشگاه کجا نگهداری می‌شود؟", a: "روی سرورهای داخل ایران با پشتیبان‌گیری روزانه. داده‌ی هر باشگاه از باشگاه‌های دیگر کاملاً جداست." },
      { q: "ورزشکاران چطور وارد می‌شوند؟", a: "با همان شماره موبایلی که در باشگاه ثبت شده و کد پیامکی؛ بدون نیاز به رمز عبور." },
    ],
    showPricing: true,
  },
  signup: { allowGymSignup: true, trialPlanKey: "starter" },
};

async function readSettings(tx: Tx): Promise<PlatformSettings> {
  const rows = await tx.platformSetting.findMany();
  const out = structuredClone(DEFAULT_PLATFORM_SETTINGS) as Record<string, unknown>;
  for (const r of rows) {
    const schema = PLATFORM_SETTING_SCHEMAS[r.key as PlatformSettingKey];
    if (!schema) continue;
    const parsed = schema.safeParse({ ...(out[r.key] as object), ...(r.value as object) });
    if (parsed.success) out[r.key] = parsed.data;
  }
  return out as PlatformSettings;
}

/** Public: used by the landing page, footer and signup. No auth. */
export async function getPlatformSettings(deps: CoreDeps): Promise<PlatformSettings> {
  return withSystem(deps.db, readSettings);
}

export async function adminSetPlatformSetting<K extends PlatformSettingKey>(deps: CoreDeps, actor: AdminActor, key: K, value: unknown) {
  const schema = PLATFORM_SETTING_SCHEMAS[key];
  if (!schema) throw notFound("تنظیم");
  const parsed = schema.parse(value);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    if (key === "signup") {
      const k = (parsed as PlatformSettings["signup"]).trialPlanKey;
      if (!(await tx.subscriptionPlan.findFirst({ where: { key: k, isActive: true } }))) throw new AppError("VALIDATION_FAILED", "پلن آزمایشی وجود ندارد یا غیرفعال است.", { fields: { trialPlanKey: ["پلن نامعتبر"] } });
    }
    const before = await tx.platformSetting.findUnique({ where: { key } });
    await tx.platformSetting.upsert({
      where: { key },
      update: { value: parsed as Prisma.InputJsonValue, updatedBy: actor.userId },
      create: { key, value: parsed as Prisma.InputJsonValue, updatedBy: actor.userId },
    });
    await audit(tx, actor, "platform.setting", "platform_setting", key, before?.value ?? null, parsed);
    return (await readSettings(tx))[key];
  });
}

// ---------- SaaS plans ----------

export async function listPublicPlans(deps: CoreDeps) {
  return withSystem(deps.db, async (tx) => {
    const plans = await tx.subscriptionPlan.findMany({
      where: { isActive: true }, orderBy: { monthlyAmountRial: "asc" },
      include: { modules: { include: { module: { select: { key: true, nameFa: true } } } } },
    });
    return plans.map((p) => ({
      key: p.key, nameFa: p.nameFa, monthlyAmountRial: p.monthlyAmountRial, annualAmountRial: p.annualAmountRial, trialDays: p.trialDays,
      limits: p.limits, modules: p.modules.map((m) => m.module),
    }));
  });
}

export async function adminListPlansFull(deps: CoreDeps, actor: AdminActor) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const [plans, modules] = await Promise.all([
      tx.subscriptionPlan.findMany({
        orderBy: { monthlyAmountRial: "asc" },
        include: { modules: { include: { module: { select: { key: true } } } }, _count: { select: { subscriptions: { where: { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] } } } } } },
      }),
      tx.module.findMany({ orderBy: { key: "asc" }, select: { key: true, nameFa: true } }),
    ]);
    return {
      modules,
      plans: plans.map((p) => ({
        id: p.id, key: p.key, nameFa: p.nameFa, monthlyAmountRial: p.monthlyAmountRial, annualAmountRial: p.annualAmountRial,
        trialDays: p.trialDays, limits: p.limits, isActive: p.isActive, modules: p.modules.map((m) => m.module.key), liveSubscriptions: p._count.subscriptions,
      })),
    };
  });
}

/** Creates a plan (input.key) or updates the one with `planId`. Module changes apply to gyms immediately. */
export async function adminSavePlan(deps: CoreDeps, actor: AdminActor, planId: string | null, input: AdminPlanInput) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const modules = await tx.module.findMany({ where: { key: { in: input.modules } }, select: { id: true, key: true } });
    if (modules.length !== new Set(input.modules).size) throw new AppError("VALIDATION_FAILED", "ماژول نامعتبر است.", { fields: { modules: ["ماژول نامعتبر"] } });
    if (!input.modules.includes("core")) throw new AppError("VALIDATION_FAILED", "ماژول «هسته» برای هر پلن لازم است.", { fields: { modules: ["هسته لازم است"] } });
    const data = {
      nameFa: input.nameFa, monthlyAmountRial: BigInt(input.monthlyAmountRial), annualAmountRial: BigInt(input.annualAmountRial),
      trialDays: input.trialDays, limits: input.limits, isActive: input.isActive,
    };
    let id: string;
    let before: unknown = null;
    if (planId) {
      const existing = await tx.subscriptionPlan.findUnique({ where: { id: planId }, include: { modules: { include: { module: { select: { key: true } } } } } });
      if (!existing) throw notFound("پلن");
      if (!input.isActive) {
        const s = await tx.platformSetting.findUnique({ where: { key: "signup" } });
        const trialKey = (s?.value as { trialPlanKey?: string } | null)?.trialPlanKey ?? DEFAULT_PLATFORM_SETTINGS.signup.trialPlanKey;
        if (trialKey === existing.key) throw new AppError("BUSINESS_RULE", "این پلن، پلن دوره‌ی آزمایشی است. اول پلن آزمایشی را در تنظیمات عوض کنید.");
      }
      before = { ...existing, monthlyAmountRial: existing.monthlyAmountRial.toString(), annualAmountRial: existing.annualAmountRial.toString(), modules: existing.modules.map((m) => m.module.key) };
      await tx.subscriptionPlan.update({ where: { id: planId }, data });
      id = planId;
    } else {
      if (!input.key) throw new AppError("VALIDATION_FAILED", "شناسه‌ی پلن را وارد کنید.", { fields: { key: ["لازم است"] } });
      if (await tx.subscriptionPlan.findUnique({ where: { key: input.key } })) throw new AppError("CONFLICT", "پلنی با این شناسه وجود دارد.", { fields: { key: ["تکراری"] } });
      id = (await tx.subscriptionPlan.create({ data: { ...data, key: input.key } })).id;
    }
    await tx.subscriptionPlanModule.deleteMany({ where: { planId: id } });
    await tx.subscriptionPlanModule.createMany({ data: modules.map((m) => ({ planId: id, moduleId: m.id })) });
    await audit(tx, actor, planId ? "platform.plan_update" : "platform.plan_create", "subscription_plan", id, before, { ...input });
    return { id };
  });
}

// ---------- Users ----------

export async function adminListUsers(deps: CoreDeps, actor: AdminActor, input: AdminUserListInput) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const q = input.q?.trim().replace(/^0/, "");
    const where = q ? { OR: [{ phone: { contains: q } }, { profile: { is: { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] } } }] } : {};
    const [total, users] = await Promise.all([
      tx.user.count({ where }),
      tx.user.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * input.pageSize, take: input.pageSize,
        include: { profile: { select: { firstName: true, lastName: true } }, memberships: { where: { status: "ACTIVE" }, select: { gym: { select: { name: true } }, role: { select: { key: true } } } } },
      }),
    ]);
    return {
      total, page: input.page, pageSize: input.pageSize,
      items: users.map((u) => ({
        id: u.id, phone: u.phone, status: u.status, isSuperAdmin: u.isSuperAdmin, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
        name: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || null,
        gyms: u.memberships.map((m) => ({ gym: m.gym.name, role: m.role.key })),
      })),
    };
  });
}

/** Disabling a user also revokes all their sessions. Super admins cannot be disabled here (use the CLI). */
export async function adminSetUserStatus(deps: CoreDeps, actor: AdminActor, userId: string, input: { status: "ACTIVE" | "DISABLED"; reason: string }) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const u = await tx.user.findUnique({ where: { id: userId }, select: { id: true, status: true, isSuperAdmin: true } });
    if (!u) throw notFound("کاربر");
    if (u.isSuperAdmin) throw new AppError("BUSINESS_RULE", "مدیر پلتفرم را از اینجا نمی‌توان غیرفعال کرد.");
    await tx.user.update({ where: { id: u.id }, data: { status: input.status } });
    if (input.status === "DISABLED") await tx.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(tx, actor, "platform.user_status", "user", u.id, { status: u.status }, input);
    return { id: u.id, status: input.status };
  });
}

// ---------- Audit log ----------

export async function adminListAudit(deps: CoreDeps, actor: AdminActor, input: AdminAuditListInput) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const where = { ...(input.gymId ? { gymId: input.gymId } : {}), ...(input.action ? { action: { startsWith: input.action } } : {}) };
    const [total, rows] = await Promise.all([
      tx.auditLog.count({ where }),
      tx.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * input.pageSize, take: input.pageSize, include: { gym: { select: { name: true } } } }),
    ]);
    const actors = await tx.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorUserId).filter((x): x is string => !!x))] } }, select: { id: true, phone: true } });
    const phone = new Map(actors.map((a) => [a.id, a.phone]));
    return {
      total, page: input.page, pageSize: input.pageSize,
      items: rows.map((r) => ({
        id: r.id, createdAt: r.createdAt, action: r.action, entityType: r.entityType, entityId: r.entityId,
        gymName: r.gym?.name ?? null, actorPhone: r.actorUserId ? phone.get(r.actorUserId) ?? null : null, actorRole: r.actorRole, ip: r.ip,
        before: r.before, after: r.after,
      })),
    };
  });
}
