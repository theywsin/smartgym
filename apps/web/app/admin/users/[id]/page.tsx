"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toPersianDigits, formatIranMobile } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { fa, jdate } from "@/lib/client/format";
import { ErrorState, LoadingState } from "@/components/states";
import { Field } from "@/components/field";

type User = {
  id: string; phone: string; status: "ACTIVE" | "DISABLED"; isSuperAdmin: boolean; adminUsername: string | null;
  createdAt: string; lastLoginAt: string | null; hasPassword: boolean; name: string | null;
  memberships: { gymId: string; gym: string; role: string; status: string }[];
  ownedGyms: { id: string; name: string; status: string }[];
  sessions: { id: string; kind: string; deviceName: string | null; ip: string | null; userAgent: string | null; lastUsedAt: string }[];
};

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "user", id], queryFn: () => api<User>(`/admin/users/${id}`) });
  const [password, setPassword] = useState("");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin"] });
  const pw = useMutation({ mutationFn: (p: string) => api(`/admin/users/${id}/password`, { method: "POST", body: { password: p } }), onSuccess: () => { setPassword(""); refresh(); } });
  const revoke = useMutation({ mutationFn: () => api(`/admin/users/${id}/sessions`, { method: "DELETE" }), onSuccess: refresh });
  const status = useMutation({ mutationFn: (s: "ACTIVE" | "DISABLED") => api(`/admin/users/${id}/status`, { method: "POST", body: { status: s, reason: "از صفحه‌ی جزئیات کاربر" } }), onSuccess: refresh });
  if (q.isPending) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const u = q.data;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-ink-2 hover:text-ink">← کاربران</Link>
        <h1 className="page-title mt-1">{u.name ?? "بدون نام"} {u.isSuperAdmin && <span className="chip text-xs">مدیر پلتفرم</span>}</h1>
        <p className="ltr-nums text-sm text-ink-2">{u.phone.startsWith("admin:") ? u.adminUsername : toPersianDigits(formatIranMobile(u.phone))} · عضویت {jdate(u.createdAt)} · آخرین ورود {jdate(u.lastLoginAt)} · {u.status === "ACTIVE" ? "فعال" : "غیرفعال"} · رمز عبور: {u.hasPassword ? "دارد" : "ندارد"}</p>
      </div>
      <section className="card space-y-3" aria-labelledby="g-t">
        <h2 id="g-t" className="card-title">باشگاه‌ها و نقش‌ها</h2>
        {u.ownedGyms.length > 0 && <p className="text-sm">مالک: {u.ownedGyms.map((g, i) => <span key={g.id}>{i > 0 && "، "}<Link className="text-brand-700 hover:underline" href={`/admin/gyms/${g.id}`}>{g.name}</Link></span>)}</p>}
        <ul className="divide-y divide-line text-sm">
          {u.memberships.map((m, i) => <li key={i} className="flex justify-between py-2"><Link className="hover:text-brand-700" href={`/admin/gyms/${m.gymId}`}>{m.gym}</Link><span className="chip text-xs">{m.role}{m.status !== "ACTIVE" && ` (${m.status})`}</span></li>)}
          {u.memberships.length === 0 && <li className="py-2 text-ink-3">در هیچ باشگاهی نقش ندارد.</li>}
        </ul>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card space-y-3" aria-labelledby="pw-t" onSubmit={(e) => { e.preventDefault(); pw.mutate(password); }}>
          <h2 id="pw-t" className="card-title">تعیین رمز عبور</h2>
          <p className="text-xs text-ink-3">کاربر با شماره موبایل و این رمز از صفحه‌ی ورود وارد می‌شود. همه‌ی نشست‌های فعلی او بسته می‌شود.</p>
          <Field label="رمز جدید (حداقل ۸ کاراکتر)" error={pw.error instanceof ApiError ? pw.error.fields?.password?.[0] : undefined}>
            <input className="input" dir="ltr" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {pw.isError && !(pw.error as ApiError).fields && <p role="alert" className="field-error">{(pw.error as ApiError).message}</p>}
          {pw.isSuccess && <p role="status" className="text-sm text-brand-700">رمز ذخیره شد.</p>}
          <button className="btn-primary" disabled={pw.isPending || password.length < 8}>ذخیره رمز</button>
        </form>
        <section className="card space-y-3" aria-labelledby="s-t">
          <h2 id="s-t" className="card-title">نشست‌های فعال ({fa(u.sessions.length)})</h2>
          <ul className="space-y-1 text-xs text-ink-2">{u.sessions.map((s) => <li key={s.id}>{s.kind} · {s.deviceName ?? s.userAgent?.slice(0, 40) ?? "—"} · <span dir="ltr">{s.ip}</span> · {jdate(s.lastUsedAt)}</li>)}</ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary h-9" disabled={revoke.isPending || !u.sessions.length} onClick={() => revoke.mutate()}>خروج از همه‌ی دستگاه‌ها</button>
            {!u.isSuperAdmin && (
              <button type="button" className={`btn-ghost h-9 ${u.status === "ACTIVE" ? "text-err-tx" : "text-brand-700"}`} disabled={status.isPending} onClick={() => status.mutate(u.status === "ACTIVE" ? "DISABLED" : "ACTIVE")}>
                {u.status === "ACTIVE" ? "غیرفعال‌کردن کاربر" : "فعال‌کردن کاربر"}
              </button>
            )}
          </div>
          {(revoke.isError || status.isError) && <p role="alert" className="field-error">{((revoke.error ?? status.error) as ApiError).message}</p>}
        </section>
      </div>
    </div>
  );
}
