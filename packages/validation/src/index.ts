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

export const qrCheckInSchema = z.object({
  token: z.string().trim().min(10).max(300),
  branchId: uuid,
});
export type QrCheckInInput = z.infer<typeof qrCheckInSchema>;

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

export const paymentLinkSchema = z.object({
  subscriptionId: uuid,
  amountRial: amountRial.refine((v) => v > 0n, "مبلغ باید بیشتر از صفر باشد").optional(),
});
export type PaymentLinkInput = z.infer<typeof paymentLinkSchema>;

export const onlinePaymentSettingsSchema = z.object({
  terminalId: z
    .string()
    .trim()
    .transform((s) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))
    .pipe(z.string().regex(/^\d{6,12}$/, "شماره ترمینال باید ۶ تا ۱۲ رقم باشد"))
    .nullable(),
});

/** Saman SEP posts application/x-www-form-urlencoded; only these fields are read. */
export const gatewayCallbackSchema = z.object({
  State: z.string().max(100).optional(),
  Status: z.string().max(10).optional(),
  RefNum: z.string().max(200).optional(),
  ResNum: z.string().max(100).optional(),
  Rrn: z.string().max(50).optional(),
  SecurePan: z.string().max(50).optional(),
  TerminalId: z.string().max(20).optional(),
  Amount: z.string().max(20).optional(),
});

export const expenseCategorySchema = z.object({ name: z.string().trim().min(1, "نام دسته را بنویسید").max(60) });
export const expenseCategoryUpdateSchema = z.object({ isActive: z.boolean() });

export const expenseSchema = z.object({
  categoryId: uuid,
  branchId: uuid.nullish(),
  amountRial: amountRial.refine((v) => v > 0n, "مبلغ باید بیشتر از صفر باشد"),
  method: paymentMethod,
  description: optionalText(300),
  /** Tehran calendar day (Gregorian ISO). Stored at noon Tehran time. Defaults to now. */
  spentAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ نامعتبر است")
    .transform((d) => new Date(`${d}T12:00:00+03:30`))
    .optional(),
});
export type ExpenseSchemaInput = z.infer<typeof expenseSchema>;

export const voidExpenseSchema = z.object({ reason: z.string().trim().min(1, "دلیل ابطال را بنویسید").max(300) });

export const jalaliMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(1300).max(1500).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  branchId: uuid.optional(),
});

export const coachPayoutSchema = z.object({
  coachUserId: uuid,
  year: z.number().int().min(1300).max(1500),
  month: z.number().int().min(1).max(12),
  amountRial: amountRial.refine((v) => v > 0n, "مبلغ باید بیشتر از صفر باشد"),
  method: paymentMethod,
});

// ───────────── Phase 3: shop and buffet ─────────────

export const productKind = z.enum(["STORE", "BUFFET"]);

export const productSchema = z.object({
  kind: productKind,
  name: z.string().trim().min(1, "نام کالا را بنویسید").max(100),
  sku: optionalText(50),
  priceRial: amountRial,
  trackStock: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, "نام کالا را بنویسید").max(100).optional(),
  sku: optionalText(50),
  priceRial: amountRial.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const stockChangeSchema = z.object({
  branchId: uuid,
  /** PURCHASE adds stock; ADJUST sets the counted quantity. */
  reason: z.enum(["PURCHASE", "ADJUST"]),
  quantity: z.number().int().min(0).max(1_000_000),
  note: optionalText(300),
});
export type StockChangeInput = z.infer<typeof stockChangeSchema>;

export const saleSchema = z.object({
  branchId: uuid.optional(),
  memberId: uuid.optional(),
  method: paymentMethod,
  items: z
    .array(z.object({ productId: uuid, quantity: z.number().int().min(1).max(1000) }))
    .min(1, "حداقل یک قلم کالا انتخاب کنید")
    .max(50),
});
export type SaleInput = z.infer<typeof saleSchema>;

export const listSalesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  branchId: uuid.optional(),
});

export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  daysBefore: z.number().int().min(1, "حداقل ۱ روز").max(14, "حداکثر ۱۴ روز"),
});

// ───────────── Phase 5: coach portal ─────────────

const exerciseSchema = z.object({
  name: z.string().trim().min(1, "نام حرکت را بنویسید").max(80),
  sets: z.number().int().min(1).max(20),
  reps: z.string().trim().min(1, "تکرار را بنویسید").max(20), // "12" or "8-10" or "30s"
  restSeconds: z.number().int().min(0).max(600).optional(),
  note: optionalText(200),
});

export const workoutProgramSchema = z.object({
  title: z.string().trim().min(1, "عنوان برنامه را بنویسید").max(100),
  goal: optionalText(100),
  notes: optionalText(1000),
  days: z
    .array(z.object({ title: z.string().trim().min(1, "عنوان روز را بنویسید").max(60), exercises: z.array(exerciseSchema).min(1, "حداقل یک حرکت اضافه کنید").max(30) }))
    .min(1, "حداقل یک روز تمرینی اضافه کنید")
    .max(7),
});
export type WorkoutProgramInput = z.infer<typeof workoutProgramSchema>;

// Platform admin
export const adminGymListSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CLOSED"]).optional(),
});
export type AdminGymListInput = z.infer<typeof adminGymListSchema>;

export const adminSetGymStatusSchema = z.object({
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CLOSED"]),
  reason: z.string().trim().min(3, "دلیل را بنویسید.").max(300),
});
export type AdminSetGymStatusInput = z.infer<typeof adminSetGymStatusSchema>;

export const adminSetGymPlanSchema = z.object({
  planKey: z.string().trim().min(1).max(40),
  months: z.coerce.number().int().min(1).max(36),
  note: z.string().trim().max(300).optional(),
});
export type AdminSetGymPlanInput = z.infer<typeof adminSetGymPlanSchema>;

export const adminPlanSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_-]{1,30}$/, "شناسه فقط حروف کوچک لاتین، عدد، - و _").optional(),
  nameFa: z.string().trim().min(2).max(60),
  monthlyAmountRial: amountRial,
  annualAmountRial: amountRial,
  trialDays: z.coerce.number().int().min(0).max(90),
  limits: z.object({
    members: z.coerce.number().int().min(1).max(1_000_000).nullable(),
    branches: z.coerce.number().int().min(1).max(1000).nullable(),
  }),
  modules: z.array(z.string().trim().min(1).max(40)).max(30),
  isActive: z.boolean(),
});
export type AdminPlanInput = z.infer<typeof adminPlanSchema>;

const shortText = (max: number) => z.string().trim().max(max);
export const PLATFORM_SETTING_SCHEMAS = {
  site: z.object({
    name: shortText(60).min(2),
    tagline: shortText(160),
    supportPhone: shortText(30),
    supportEmail: z.union([z.literal(""), z.email()]),
    address: shortText(300),
    instagram: shortText(100),
    telegram: shortText(100),
  }),
  landing: z.object({
    heroTitle: shortText(120).min(2),
    heroSubtitle: shortText(400),
    ctaText: shortText(40).min(2),
    features: z.array(z.object({ title: shortText(80).min(1), body: shortText(400) })).max(12),
    faq: z.array(z.object({ q: shortText(200).min(1), a: shortText(1500) })).max(20),
    showPricing: z.boolean(),
  }),
  signup: z.object({
    allowGymSignup: z.boolean(),
    trialPlanKey: shortText(40).min(1),
  }),
} as const;
export type PlatformSettingKey = keyof typeof PLATFORM_SETTING_SCHEMAS;
export type PlatformSettings = { [K in PlatformSettingKey]: z.infer<(typeof PLATFORM_SETTING_SCHEMAS)[K]> };

export const adminUserListSchema = paginationSchema.extend({ q: z.string().trim().max(40).optional() });
export type AdminUserListInput = z.infer<typeof adminUserListSchema>;
export const adminUserStatusSchema = z.object({ status: z.enum(["ACTIVE", "DISABLED"]), reason: z.string().trim().min(3).max(300) });
export const adminAuditListSchema = paginationSchema.extend({
  gymId: uuid.optional(),
  action: z.string().trim().max(60).optional(),
});
export type AdminAuditListInput = z.infer<typeof adminAuditListSchema>;

// Support tickets
export const TICKET_CATEGORIES = {
  PLATFORM: ["فنی", "مالی و اشتراک", "پیشنهاد", "سایر"],
  GYM: ["اشتراک و تمدید", "برنامه‌ی تمرینی", "پرداخت", "انتقاد و پیشنهاد", "سایر"],
} as const;
export const ticketCreateSchema = z.object({
  subject: z.string().trim().min(3, "موضوع کوتاه است.").max(120),
  category: z.string().trim().min(1).max(40),
  body: z.string().trim().min(2, "متن پیام را بنویسید.").max(5000),
});
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export const ticketReplySchema = z.object({ body: z.string().trim().min(1, "متن پیام را بنویسید.").max(5000) });
export const ticketListSchema = z.object({
  scope: z.enum(["PLATFORM", "GYM"]).default("GYM"),
  status: z.enum(["OPEN", "ANSWERED", "CLOSED"]).optional(),
});
export type TicketListInput = z.infer<typeof ticketListSchema>;
