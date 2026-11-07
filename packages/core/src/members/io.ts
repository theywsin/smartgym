import { withTenant } from "@smartgym/db";
import { formatJalali, isoDateToJalali, normalizePersianText, parseJalaliDate, toLatinDigits, toPersianDigits } from "@smartgym/shared";
import { memberInputSchema, type MemberInput } from "@smartgym/validation";
import { AppError } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole } from "../rbac/access";
import { membershipSummary, SUMMARY_SUBS_INCLUDE } from "../memberships/state";
import { memberScope } from "./index";
import { currentCoaches } from "./coach-lookup";
import { parseCsv, toCsv } from "./csv";

export const MAX_IMPORT_ROWS = 2000;

const STATE_FA: Record<string, string> = {
  active: "فعال", exhausted: "جلسات تمام شده", suspended: "تعلیق", upcoming: "شروع آینده", expired: "منقضی", none: "بدون اشتراک",
};

/** Header aliases accepted on import (Persian or English, case-insensitive). */
const COLUMNS: Record<keyof ImportRow, string[]> = {
  firstName: ["نام", "firstname", "first name", "first_name"],
  lastName: ["نام خانوادگی", "lastname", "last name", "last_name"],
  phone: ["موبایل", "تلفن همراه", "شماره موبایل", "phone", "mobile"],
  gender: ["جنسیت", "gender"],
  birthDate: ["تاریخ تولد", "birthdate", "birth date", "birth_date"],
  nationalCode: ["کد ملی", "nationalcode", "national code", "national_code"],
  branch: ["شعبه", "branch"],
  notes: ["یادداشت", "توضیحات", "notes"],
};
type ImportRow = { firstName: string; lastName: string; phone: string; gender: string; birthDate: string; nationalCode: string; branch: string; notes: string };

export const IMPORT_TEMPLATE_HEADERS = ["نام", "نام خانوادگی", "موبایل", "جنسیت", "تاریخ تولد", "کد ملی", "شعبه", "یادداشت"];

export async function exportMembersCsv(deps: CoreDeps, ctx: TenantContext): Promise<{ filename: string; csv: string; count: number }> {
  requirePermission(ctx, "members.export");
  const now = nowOf(deps);
  return withTenant(deps.db, ctx, async (tx) => {
    const [members, branches] = await Promise.all([
      tx.member.findMany({
        where: { gymId: ctx.gymId, status: "ACTIVE", ...memberScope(ctx) },
        orderBy: { code: "asc" },
        take: 20_000,
        include: { subscriptions: SUMMARY_SUBS_INCLUDE },
      }),
      tx.branch.findMany({ where: { gymId: ctx.gymId }, select: { id: true, name: true } }),
    ]);
    const branchName = new Map(branches.map((b) => [b.id, b.name]));
    const coach = await currentCoaches(tx, ctx, members.map((m) => m.id));
    const rows = members.map((m) => {
      const s = membershipSummary(m.subscriptions, now);
      return [
        m.code,
        m.firstName,
        m.lastName,
        m.phone ? `0${m.phone.slice(3)}` : "",
        m.gender === "MALE" ? "مرد" : m.gender === "FEMALE" ? "زن" : "",
        m.birthDate ? isoDateToJalali(m.birthDate.toISOString()) : "",
        m.nationalCode ?? "",
        m.homeBranchId ? branchName.get(m.homeBranchId) ?? "" : "",
        s.planName ?? "",
        STATE_FA[s.state] ?? s.state,
        s.endsAt ? toLatinDigits(formatJalali(s.endsAt)) : "",
        coach.get(m.id)?.name ?? "",
      ];
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "member.export", entityType: "member", after: { count: rows.length },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return {
      filename: `members-${toLatinDigits(formatJalali(now)).replace(/\//g, "-")}.csv`,
      count: rows.length,
      csv: toCsv([["کد عضویت", "نام", "نام خانوادگی", "موبایل", "جنسیت", "تاریخ تولد", "کد ملی", "شعبه", "پلن", "وضعیت", "پایان اشتراک", "مربی"], ...rows]),
    };
  });
}

export type ImportReport = {
  imported: number;
  dryRun: boolean;
  totalRows: number;
  errors: { row: number; field: string | null; message: string }[];
};

/**
 * All-or-nothing CSV import. Every row is validated first; if any row has an error nothing is
 * written and the report lists every problem with its spreadsheet row number. With dryRun the
 * file is only checked.
 */
export async function importMembersCsv(deps: CoreDeps, ctx: TenantContext, text: string, opts: { dryRun: boolean }): Promise<ImportReport> {
  requirePermission(ctx, "members.create");
  requireWritableGym(ctx);
  const table = parseCsv(normalizePersianText(text));
  if (table.length < 2) throw new AppError("VALIDATION_FAILED", "فایل خالی است یا فقط سطر عنوان دارد.");
  const header = table[0]!.map((h) => toLatinDigits(h).trim().toLowerCase());
  const index = Object.fromEntries(
    (Object.keys(COLUMNS) as (keyof ImportRow)[]).map((k) => [k, header.findIndex((h) => COLUMNS[k].includes(h))])
  ) as Record<keyof ImportRow, number>;
  if (index.firstName < 0 || index.lastName < 0) {
    throw new AppError("VALIDATION_FAILED", "ستون‌های «نام» و «نام خانوادگی» در سطر اول فایل پیدا نشد.");
  }
  const body = table.slice(1);
  if (body.length > MAX_IMPORT_ROWS) {
    throw new AppError("VALIDATION_FAILED", `حداکثر ${toPersianDigits(MAX_IMPORT_ROWS)} عضو در هر فایل قابل ورود است.`);
  }

  return withTenant(deps.db, ctx, async (tx) => {
    const branches = await tx.branch.findMany({ where: { gymId: ctx.gymId, deletedAt: null }, select: { id: true, name: true } });
    const branchByName = new Map(branches.map((b) => [normalizePersianText(b.name.trim()), b.id]));
    const allowedBranch = (id: string) => !ctx.branchIds || ctx.branchIds.includes(id);
    const defaultBranch = ctx.branchIds?.length === 1 ? ctx.branchIds[0] : undefined;
    const errors: ImportReport["errors"] = [];
    const valid: MemberInput[] = [];
    const seenPhones = new Map<string, number>();

    body.forEach((cells, i) => {
      const rowNo = i + 2; // spreadsheet row (1 = header)
      const get = (k: keyof ImportRow) => (index[k] >= 0 ? (cells[index[k]] ?? "").trim() : "");
      const err = (field: string | null, message: string) => errors.push({ row: rowNo, field, message });
      const g = get("gender");
      const gender = /^(زن|female|f|خانم)$/i.test(g) ? "FEMALE" : /^(مرد|male|m|آقا)$/i.test(g) ? "MALE" : undefined;
      if (g && !gender) err("جنسیت", "جنسیت باید «زن» یا «مرد» باشد.");
      let birthDate: string | undefined;
      if (get("birthDate")) {
        birthDate = parseJalaliDate(get("birthDate")) ?? undefined;
        if (!birthDate) err("تاریخ تولد", "تاریخ تولد باید شمسی و به شکل ۱۳۷۰/۰۵/۱۲ باشد.");
      }
      let homeBranchId = defaultBranch;
      if (get("branch")) {
        homeBranchId = branchByName.get(get("branch"));
        if (!homeBranchId) err("شعبه", `شعبه «${get("branch")}» وجود ندارد.`);
        else if (!allowedBranch(homeBranchId)) err("شعبه", "به این شعبه دسترسی ندارید.");
      } else if (ctx.branchIds && !defaultBranch) err("شعبه", "شعبه را مشخص کنید.");
      const parsed = memberInputSchema.safeParse({
        firstName: get("firstName"),
        lastName: get("lastName"),
        phone: get("phone"),
        nationalCode: toLatinDigits(get("nationalCode")),
        notes: get("notes"),
        gender,
        birthDate,
        homeBranchId,
      });
      if (!parsed.success) {
        const label: Record<string, string> = { firstName: "نام", lastName: "نام خانوادگی", phone: "موبایل", nationalCode: "کد ملی", notes: "یادداشت" };
        for (const issue of parsed.error.issues) err(label[String(issue.path[0])] ?? String(issue.path[0]), issue.message);
        return;
      }
      if (parsed.data.phone) {
        const prev = seenPhones.get(parsed.data.phone);
        if (prev) err("موبایل", `این شماره در سطر ${toPersianDigits(prev)} هم آمده است.`);
        else seenPhones.set(parsed.data.phone, rowNo);
      }
      valid.push(parsed.data);
    });

    if (seenPhones.size > 0) {
      const taken = await tx.member.findMany({
        where: { gymId: ctx.gymId, status: "ACTIVE", phone: { in: [...seenPhones.keys()] } },
        select: { phone: true, code: true },
      });
      for (const t of taken) {
        errors.push({ row: seenPhones.get(t.phone!)!, field: "موبایل", message: `این شماره برای عضو ${toPersianDigits(t.code)} ثبت شده است.` });
      }
    }
    errors.sort((a, b) => a.row - b.row);
    const report: ImportReport = { imported: 0, dryRun: opts.dryRun, totalRows: body.length, errors };
    if (errors.length > 0 || opts.dryRun) return report;

    // Same per-gym lock as createMember so member numbers stay sequential.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`member-code:${ctx.gymId}`}))`;
    const last = await tx.member.findFirst({ where: { gymId: ctx.gymId }, orderBy: { code: "desc" }, select: { code: true } });
    let code = last?.code ?? 1000;
    const users = await tx.user.findMany({ where: { phone: { in: [...seenPhones.keys()] } }, select: { id: true, phone: true } });
    const userByPhone = new Map(users.map((u) => [u.phone, u.id]));
    await tx.member.createMany({
      data: valid.map((v) => ({
        gymId: ctx.gymId,
        code: ++code,
        userId: v.phone ? userByPhone.get(v.phone) ?? null : null,
        homeBranchId: v.homeBranchId ?? null,
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone ?? null,
        gender: v.gender ?? null,
        birthDate: v.birthDate ? new Date(`${v.birthDate}T00:00:00Z`) : null,
        nationalCode: v.nationalCode ?? null,
        notes: v.notes ?? null,
        createdByUserId: ctx.userId,
      })),
    });
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "member.import", entityType: "member", after: { count: valid.length, firstCode: (last?.code ?? 1000) + 1, lastCode: code },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
    return { ...report, imported: valid.length };
  });
}
