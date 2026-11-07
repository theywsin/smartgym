/**
 * Request/response contracts shared by the web app, the mobile app and the API.
 */
import { z } from "zod";
import { GYM_ROLES, normalizeIranMobile, normalizePersianText } from "@smartgym/shared";

/** Accepts any common Iranian mobile format and outputs E.164. */
export const iranMobile = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normalizeIranMobile(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "شماره موبایل معتبر نیست" });
      return z.NEVER;
    }
    return n;
  });

export const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "کد تأیید باید ۶ رقم باشد");

export const otpRequestSchema = z.object({
  phone: iranMobile,
  purpose: z.enum(["LOGIN", "RESET_PASSWORD", "VERIFY_PHONE"]).default("LOGIN"),
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: iranMobile,
  code: otpCode,
  deviceName: z.string().trim().max(100).optional(),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const passwordLoginSchema = z.object({
  phone: iranMobile,
  password: z.string().min(1).max(200),
  deviceName: z.string().trim().max(100).optional(),
});

export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(200),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });

export const uuid = z.uuid();

export const activeGymSchema = z.object({ gymId: uuid });

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/, "شناسه باید ۳ تا ۵۰ حرف انگلیسی، عدد یا خط تیره باشد");

export const registerGymSchema = z.object({
  name: z.string().trim().min(2, "نام باشگاه را وارد کنید").max(120),
  slug: slug.optional(),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  firstBranchName: z.string().trim().min(1).max(120).default("شعبه اصلی"),
});
export type RegisterGymInput = z.infer<typeof registerGymSchema>;

export const createBranchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const inviteStaffSchema = z.object({
  phone: iranMobile,
  role: z.enum(GYM_ROLES).exclude(["GYM_OWNER", "ATHLETE"]),
  branchIds: z.array(uuid).max(50).default([]),
  firstName: z.string().trim().max(60).optional(),
  lastName: z.string().trim().max(60).optional(),
});
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// ───────────── Phase 2: members, memberships, attendance ─────────────

/** Money in rial: a non-negative integer, sent as a JSON number or a digit string. Output is bigint. */
export const amountRial = z
  .union([z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), z.string().trim().regex(/^\d{1,18}$/)])
  .transform((v) => BigInt(v));

const name = (label: string) => z.string().trim().min(1, `${label} را وارد کنید`).max(60).transform(normalizePersianText);
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());
const optionalMobile = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), iranMobile.optional());

/** YYYY-MM-DD (Gregorian). The UI converts from Jalali. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ معتبر نیست");

export const nationalCode = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد")
  .refine((code) => {
    if (/^(\d)\1{9}$/.test(code)) return false;
    const digits = code.split("").map(Number);
    const check = digits[9]!;
    const sum = digits.slice(0, 9).reduce((acc, d, i) => acc + d * (10 - i), 0) % 11;
    return sum < 2 ? check === sum : check === 11 - sum;
  }, "کد ملی معتبر نیست");

export const memberInputSchema = z.object({
  firstName: name("نام"),
  lastName: name("نام خانوادگی"),
  phone: optionalMobile,
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  birthDate: z.preprocess((v) => (v === "" ? undefined : v), isoDate.optional()),
  nationalCode: z.preprocess((v) => (v === "" ? undefined : v), nationalCode.optional()),
  homeBranchId: z.preprocess((v) => (v === "" ? undefined : v), uuid.optional()),
  emergencyContactName: optionalText(80),
  emergencyContactPhone: optionalMobile,
  notes: optionalText(2000),
});
export type MemberInput = z.infer<typeof memberInputSchema>;
export const updateMemberSchema = memberInputSchema.partial();
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const listMembersSchema = paginationSchema.extend({
  q: z.string().trim().max(60).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  /** active = has a running period; expiring = ends within 7 days; expired = has none running. */
  membership: z.enum(["active", "expiring", "expired", "suspended", "none"]).optional(),
  branchId: uuid.optional(),
  coachUserId: uuid.optional(),
});
export type ListMembersInput = z.infer<typeof listMembersSchema>;

export const membershipPlanSchema = z.object({
  name: z.string().trim().min(1, "نام پلن را وارد کنید").max(80),
  description: optionalText(500),
  durationDays: z.coerce.number().int().min(1, "مدت باید حداقل ۱ روز باشد").max(3650),
  priceAmountRial: amountRial,
  entryLimit: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().int().min(1).max(10000).optional()),
  allowedBranchIds: z.array(uuid).max(50).default([]),
  isActive: z.boolean().default(true),
});
export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>;
// No defaults on update: a PATCH that omits a field must leave it unchanged.
export const updateMembershipPlanSchema = membershipPlanSchema
  .extend({ allowedBranchIds: z.array(uuid).max(50), isActive: z.boolean() })
  .partial();
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>;

export const sellMembershipSchema = z.object({
  memberId: uuid,
  planId: uuid,
  branchId: uuid.optional(),
  /** Defaults to now, or to the end of the member's current period when renewing. */
  startsAt: z.iso.datetime({ offset: true }).optional(),
  discountAmountRial: amountRial.default(0n),
  note: optionalText(500),
  /** Money taken at the counter with the sale. Less than the price leaves a debt. */
  payment: z.lazy(() => paymentInputSchema).optional(),
});
export type SellMembershipInput = z.infer<typeof sellMembershipSchema>;

export const membershipActionSchema = z.object({ note: optionalText(500) });

export const checkInSchema = z.object({
  memberId: uuid,
  branchId: uuid,
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const listAttendanceSchema = paginationSchema.extend({
  branchId: uuid.optional(),
  memberId: uuid.optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});
export type ListAttendanceInput = z.infer<typeof listAttendanceSchema>;

export const memberNoteSchema = z.object({
  body: z.string().trim().min(1, "متن یادداشت را وارد کنید").max(4000),
});

export const assignCoachSchema = z.object({ coachUserId: uuid.nullable() });

export const updateCoachSchema = z.object({
  bio: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(1000).nullable()).optional(),
  specializations: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  commissionRateBp: z.number().int().min(0).max(10000).nullable().optional(),
});
export type UpdateCoachInput = z.infer<typeof updateCoachSchema>;

// ───────────── Phase 3: payments ─────────────

export const paymentMethod = z.enum(["CASH", "CARD_POS", "TRANSFER"]);

export const paymentInputSchema = z.object({
  amountRial: amountRial.refine((v) => v > 0n, "مبلغ باید بیشتر از صفر باشد"),
  method: paymentMethod,
  reference: optionalText(64),
});
export type PaymentInput = z.infer<typeof paymentInputSchema>;

export const recordPaymentSchema = paymentInputSchema.extend({
  subscriptionId: uuid,
  note: optionalText(500),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const refundSchema = z.object({
  amountRial: amountRial.refine((v) => v > 0n, "مبلغ باید بیشتر از صفر باشد"),
  method: paymentMethod,
  reason: z.string().trim().min(1, "دلیل بازگشت وجه را بنویسید").max(500),
});
export type RefundInput = z.infer<typeof refundSchema>;

export const cashReportSchema = z.object({
  /** Tehran calendar day, YYYY-MM-DD (Gregorian). Defaults to today. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  branchId: uuid.optional(),
});

export { z };
