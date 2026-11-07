"use client";

import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { isoDateToJalali, parseJalaliDate, toPersianDigits, formatIranMobile } from "@smartgym/shared";
import { memberInputSchema, type MemberInput } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { useMe } from "@/lib/client/me";

type Branch = { id: string; name: string };
export type MemberFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: "" | "MALE" | "FEMALE";
  birthDateJalali: string;
  nationalCode: string;
  homeBranchId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
};

export function memberToForm(m: {
  firstName: string; lastName: string; phone: string | null; gender: string | null; birthDate: string | null;
  nationalCode: string | null; homeBranchId: string | null; emergencyContact: { name?: string | null; phone?: string | null } | null; notes: string | null;
}): MemberFormValues {
  return {
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phone ? formatIranMobile(m.phone).replace(/\s/g, "") : "",
    gender: (m.gender as MemberFormValues["gender"]) ?? "",
    birthDateJalali: m.birthDate ? toPersianDigits(isoDateToJalali(m.birthDate)) : "",
    nationalCode: m.nationalCode ?? "",
    homeBranchId: m.homeBranchId ?? "",
    emergencyContactName: m.emergencyContact?.name ?? "",
    emergencyContactPhone: m.emergencyContact?.phone ? formatIranMobile(m.emergencyContact.phone).replace(/\s/g, "") : "",
    notes: m.notes ?? "",
  };
}

const FIELD_MAP: Record<string, keyof MemberFormValues> = { birthDate: "birthDateJalali" };

export function MemberForm({
  defaultValues,
  submitLabel,
  pending,
  serverError,
  onSubmit,
  onCancel,
}: {
  defaultValues?: MemberFormValues;
  submitLabel: string;
  pending: boolean;
  serverError: unknown;
  onSubmit: (input: MemberInput, setFieldError: (field: string, message: string) => void) => void;
  onCancel?: () => void;
}) {
  const me = useMe();
  const scoped = me.access?.branchIds ?? null;
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const form = useForm<MemberFormValues>({
    defaultValues: defaultValues ?? {
      firstName: "", lastName: "", phone: "", gender: "", birthDateJalali: "", nationalCode: "",
      homeBranchId: scoped?.length === 1 ? scoped[0]! : "", emergencyContactName: "", emergencyContactPhone: "", notes: "",
    },
  });
  const errors = form.formState.errors;
  const setFieldError = (field: string, message: string) =>
    form.setError((FIELD_MAP[field] ?? field) as keyof MemberFormValues, { message });

  const submit = form.handleSubmit((v) => {
    const birthDate = v.birthDateJalali.trim() ? parseJalaliDate(v.birthDateJalali) : undefined;
    const parsed = memberInputSchema.safeParse({
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      gender: v.gender || undefined,
      birthDate: birthDate ?? undefined,
      nationalCode: v.nationalCode,
      homeBranchId: v.homeBranchId,
      emergencyContactName: v.emergencyContactName,
      emergencyContactPhone: v.emergencyContactPhone,
      notes: v.notes,
    });
    const badDate = birthDate === null;
    if (badDate) form.setError("birthDateJalali", { message: "تاریخ را به شکل ۱۳۷۰/۰۵/۱۲ وارد کنید." });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) setFieldError(String(issue.path[0]), issue.message);
      return;
    }
    if (badDate) return;
    onSubmit(parsed.data, setFieldError);
  });

  const field = (name: keyof MemberFormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`m-${name}`}>{label}</label>
      <input id={`m-${name}`} className="input" aria-invalid={!!errors[name]} {...props} {...form.register(name)} />
      {errors[name] && <p className="field-error">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form className="card space-y-5" noValidate onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("firstName", "نام *", { autoComplete: "off" })}
        {field("lastName", "نام خانوادگی *", { autoComplete: "off" })}
        {field("phone", "موبایل", { inputMode: "tel", placeholder: "09123456789", className: "input ltr-nums text-left" })}
        <div>
          <label className="label" htmlFor="m-gender">جنسیت</label>
          <select id="m-gender" className="input" {...form.register("gender")}>
            <option value="">—</option>
            <option value="FEMALE">زن</option>
            <option value="MALE">مرد</option>
          </select>
        </div>
        {field("birthDateJalali", "تاریخ تولد", { placeholder: "۱۳۷۰/۰۵/۱۲", inputMode: "numeric" })}
        {field("nationalCode", "کد ملی", { inputMode: "numeric", className: "input ltr-nums text-left", maxLength: 10 })}
        <div>
          <label className="label" htmlFor="m-branch">شعبه</label>
          <select id="m-branch" className="input" aria-invalid={!!errors.homeBranchId} {...form.register("homeBranchId")}>
            {!scoped && <option value="">بدون شعبه مشخص</option>}
            {branches.data?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {errors.homeBranchId && <p className="field-error">{errors.homeBranchId.message}</p>}
        </div>
      </div>
      <fieldset className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-bold">تماس اضطراری</legend>
        {field("emergencyContactName", "نام و نسبت")}
        {field("emergencyContactPhone", "موبایل", { inputMode: "tel", className: "input ltr-nums text-left" })}
      </fieldset>
      <div>
        <label className="label" htmlFor="m-notes">یادداشت</label>
        <textarea id="m-notes" rows={3} className="input h-auto py-2" {...form.register("notes")} />
      </div>
      {serverError != null && !(serverError instanceof ApiError && serverError.fields) && (
        <p role="alert" className="field-error">{serverError instanceof ApiError ? serverError.message : "خطا در ذخیره"}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>انصراف</button>
        )}
      </div>
    </form>
  );
}

export function applyServerFieldErrors(e: unknown, setFieldError: (field: string, message: string) => void) {
  if (e instanceof ApiError && e.fields) {
    for (const [k, v] of Object.entries(e.fields)) if (v[0]) setFieldError(k, v[0]);
  }
}
