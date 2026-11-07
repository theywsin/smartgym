"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ROLE_LABELS_FA, formatIranMobile, toPersianDigits, type GymRole } from "@smartgym/shared";
import { api, ApiError } from "@/lib/client/api";
import { jdate } from "@/lib/client/format";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { FormDialog, type DialogRequest } from "@/components/form-dialog";

type User = { id: string; phone: string; status: "ACTIVE" | "DISABLED"; isSuperAdmin: boolean; createdAt: string; lastLoginAt: string | null; name: string | null; gyms: { gym: string; role: string }[] };

export default function UsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [deb, setDeb] = useState("");
  const [dlg, setDlg] = useState<DialogRequest | null>(null);
  useEffect(() => { const t = setTimeout(() => setDeb(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  const list = useQuery({ queryKey: ["admin", "users", deb], queryFn: () => api<{ total: number; items: User[] }>(`/admin/users?pageSize=50&q=${encodeURIComponent(deb)}`) });
  const st = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: User["status"]; reason: string }) => api(`/admin/users/${id}/status`, { method: "POST", body: { status, reason } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
  return (
    <div className="space-y-6">
      <FormDialog request={dlg} onClose={() => setDlg(null)} />
      <h1 className="page-title">کاربران</h1>
      <label className="relative block max-w-md">
        <span className="sr-only">جستجو</span>
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input className="input pr-9" placeholder="موبایل یا نام" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      {st.isError && <p role="alert" className="field-error">{(st.error as ApiError).message}</p>}
      {list.isPending && <LoadingState />}
      {list.isError && <ErrorState error={list.error} onRetry={() => list.refetch()} />}
      {list.data?.items.length === 0 && <EmptyState title="کاربری پیدا نشد" />}
      {list.data && list.data.items.length > 0 && (
        <ul className="card divide-y divide-line p-0">
          {list.data.items.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <div className="min-w-[180px] flex-1">
                <p className="font-semibold">{u.name ?? "بدون نام"} {u.isSuperAdmin && <span className="chip text-xs">مدیر پلتفرم</span>}</p>
                <p className="ltr-nums text-xs text-ink-3">{toPersianDigits(formatIranMobile(u.phone))}</p>
              </div>
              <p className="min-w-[200px] flex-1 text-xs text-ink-2">{u.gyms.length ? u.gyms.map((g) => `${g.gym} (${ROLE_LABELS_FA[g.role as GymRole] ?? g.role})`).join("، ") : "—"}</p>
              <p className="w-32 text-xs text-ink-3">آخرین ورود: {jdate(u.lastLoginAt)}</p>
              {u.status === "DISABLED" && <span className="chip border-[#fecaca] bg-err-bg text-err-tx">غیرفعال</span>}
              {!u.isSuperAdmin && (
                <button type="button" className={`btn-ghost h-8 px-2 text-xs ${u.status === "ACTIVE" ? "text-err-tx" : "text-brand-700"}`}
                  onClick={() => setDlg({
                    title: u.status === "ACTIVE" ? "غیرفعال کردن کاربر" : "فعال کردن کاربر",
                    description: u.status === "ACTIVE" ? "همه‌ی نشست‌های این کاربر بسته می‌شود و دیگر نمی‌تواند وارد شود." : undefined,
                    fields: [{ name: "reason", label: "دلیل (در گزارش ثبت می‌شود)" }],
                    danger: u.status === "ACTIVE",
                    confirmLabel: u.status === "ACTIVE" ? "غیرفعال کن" : "فعال کن",
                    onSubmit: (v) => { st.mutate({ id: u.id, status: u.status === "ACTIVE" ? "DISABLED" : "ACTIVE", reason: v.reason! }); },
                  })}>
                  {u.status === "ACTIVE" ? "غیرفعال کردن" : "فعال کردن"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
