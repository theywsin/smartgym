/**
 * Request/response contracts shared by the web app, the mobile app and the API.
 */
import { z } from "zod";
import { GYM_ROLES, normalizeIranMobile } from "@smartgym/shared";

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

export { z };
