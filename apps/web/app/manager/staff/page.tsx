"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, UserPlus } from "lucide-react";
import { BRANCH_SCOPED_ROLES, formatIranMobile, ROLE_LABELS_FA, toPersianDigits, type GymRole } from "@smartgym/shared";
import { inviteStaffSchema } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { useCan } from "@/lib/client/me";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

type StaffRow = {
  membershipId: string;
  userId: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: GymRole;
  status: string;
  branchIds: string[];
};
type Branch = { id: string; name: string };
type FormIn = z.input<typeof inviteStaffSchema>;
type FormOut = z.output<typeof inviteStaffSchema>;

const INVITABLE: GymRole[] = ["GYM_MANAGER", "BRANCH_MANAGER", "RECEPTIONIST", "COACH", "ACCOUNTANT", "STORE_MANAGER"];

export default function StaffPage() {
  const qc = useQueryClient();
  const canManage = useCan("staff.manage");
  const canAppointManagers = useCan("settings.manage");
  const [formOpen, setFormOpen] = useState(false);
  const [q, setQ] = useState("");
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => api<StaffRow[]>("/users/staff") });
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches") });
  const branchName = useMemo(() => new Map(branches.data?.map((b) => [b.id, b.name])), [branches.data]);

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { role: "RECEPTIONIST", branchIds: [] },
  });
  const role = form.watch("role") as GymRole;
  const invite = useMutation({
    mutationFn: (v: FormOut) => api("/users/staff/invite", { method: "POST", body: v }),
    onSuccess: () => {
      form.reset({ role: "RECEPTIONIST", branchIds: [] });
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fields) {
        for (const [k, v] of Object.entries(e.fields)) form.setError(k as keyof FormIn, { message: v[0] });
      }
    },
  });

  const rows = (staff.data ?? []).filter((s) => {
    if (!q.trim()) return true;
    const hay = `${s.firstName ?? ""} ${s.lastName ?? ""} ${s.phone} ${formatIranMobile(s.phone)}`;
    return hay.includes(q.trim());
  });
  const roles = INVITABLE.filter((r) => r !== "GYM_MANAGER" || canAppointManagers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">کارکنان</h1>
          <p className="text-sm text-ink-2">همکاران با شماره موبایل خود و کد پیامکی وارد می‌شوند. رمز عبوری ساخته یا ارسال نمی‌شود.</p>
        </div>
        {canManage && !formOpen && (
          <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
            <UserPlus className="size-4" aria-hidden />
            افزودن همکار
          </button>
        )}
      </div>

      {formOpen && (
        <form className="card space-y-4" noValidate onSubmit={form.handleSubmit((v) => invite.mutate(v))} aria-labelledby="invite-title">
          <h2 id="invite-title" className="card-title">افزودن همکار</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-first">نام</label>
              <input id="s-first" className="input" {...form.register("firstName", { setValueAs: (v) => v || undefined })} />
            </div>
            <div>
              <label className="label" htmlFor="s-last">نام خانوادگی</label>
              <input id="s-last" className="input" {...form.register("lastName", { setValueAs: (v) => v || undefined })} />
            </div>
            <div>
              <label className="label" htmlFor="s-phone">شماره موبایل</label>
              <input id="s-phone" className="input ltr-nums text-left" inputMode="tel" placeholder="09123456789" aria-invalid={!!form.formState.errors.phone} {...form.register("phone")} />
              {form.formState.errors.phone && <p className="field-error">{form.formState.errors.phone.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="s-role">نقش</label>
              <select id="s-role" className="input" {...form.register("role")}>
                {roles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS_FA[r]}</option>
                ))}
              </select>
            </div>
          </div>
          {BRANCH_SCOPED_ROLES.has(role) && (
            <fieldset>
              <legend className="label">شعبه‌های مجاز</legend>
              <div className="flex flex-wrap gap-2">
                {branches.data?.map((b) => (
                  <label key={b.id} className="chip cursor-pointer has-[:checked]:border-brand-200 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                    <input type="checkbox" value={b.id} className="accent-brand-600" {...form.register("branchIds")} />
                    {b.name}
                  </label>
                ))}
              </div>
              {form.formState.errors.branchIds && <p className="field-error">{form.formState.errors.branchIds.message}</p>}
            </fieldset>
          )}
          {invite.error && <p role="alert" className="field-error">{invite.error instanceof ApiError ? invite.error.message : "خطا در ذخیره"}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={invite.isPending}>
              {invite.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              افزودن
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setFormOpen(false); invite.reset(); }}>
              انصراف
            </button>
          </div>
        </form>
      )}

      <div className="card p-0">
        <div className="border-b border-line p-4">
          <label className="relative block max-w-xs">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input className="input pr-9" placeholder="جستجوی نام یا شماره" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        {staff.isPending && <LoadingState />}
        {staff.isError && <div className="p-4"><ErrorState error={staff.error} onRetry={() => staff.refetch()} /></div>}
        {staff.data && rows.length === 0 && <EmptyState title={q ? "نتیجه‌ای یافت نشد" : "هنوز همکاری اضافه نشده است"} />}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-right text-xs text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">نام</th>
                  <th scope="col" className="px-4 py-3 font-semibold">موبایل</th>
                  <th scope="col" className="px-4 py-3 font-semibold">نقش</th>
                  <th scope="col" className="px-4 py-3 font-semibold">شعبه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.membershipId}>
                    <td className="px-4 py-3 font-semibold">{[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-4 py-3"><span className="ltr-nums">{toPersianDigits(formatIranMobile(s.phone))}</span></td>
                    <td className="px-4 py-3"><span className="chip">{ROLE_LABELS_FA[s.role] ?? s.role}</span></td>
                    <td className="px-4 py-3 text-ink-2">
                      {s.branchIds.length === 0 ? "همه شعب" : s.branchIds.map((id) => branchName.get(id) ?? "—").join("، ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
