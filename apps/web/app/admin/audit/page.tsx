"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatIranMobile, toPersianDigits } from "@smartgym/shared";
import { api } from "@/lib/client/api";
import { fa, jdate } from "@/lib/client/format";
import { ErrorState, LoadingState } from "@/components/states";

type Row = { id: string; createdAt: string; action: string; entityType: string; entityId: string | null; gymName: string | null; actorPhone: string | null; actorRole: string | null; ip: string | null; before: unknown; after: unknown };

const time = (d: string) => new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }).format(new Date(d));

export default function AuditPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["admin", "audit", action, page],
    queryFn: () => api<{ total: number; pageSize: number; items: Row[] }>(`/admin/audit?pageSize=50&page=${page}${action ? `&action=${encodeURIComponent(action)}` : ""}`),
  });
  return (
    <div className="space-y-6">
      <h1 className="page-title">گزارش ممیزی</h1>
      <select className="input w-auto" aria-label="نوع رویداد" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
        <option value="">همه‌ی رویدادها</option>
        <option value="platform.">مدیریت پلتفرم</option>
        <option value="gym.">باشگاه</option>
        <option value="staff.">کارکنان</option>
        <option value="payment.">پرداخت‌ها</option>
        <option value="membership.">اشتراک اعضا</option>
        <option value="attendance.">حضور</option>
      </select>
      {q.isPending && <LoadingState />}
      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <ul className="card divide-y divide-line p-0 text-sm">
            {q.data.items.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="ltr-nums w-40 text-xs text-ink-3">{jdate(r.createdAt)} {time(r.createdAt)}</span>
                    <code className="text-xs font-semibold" dir="ltr">{r.action}</code>
                    <span className="text-ink-2">{r.gymName ?? "پلتفرم"}</span>
                    <span className="ltr-nums text-xs text-ink-3">{r.actorPhone ? toPersianDigits(formatIranMobile(r.actorPhone)) : r.actorRole ?? "سیستم"}</span>
                  </summary>
                  <pre dir="ltr" className="mt-2 overflow-x-auto rounded-lg bg-line-2 p-3 text-left text-xs">{JSON.stringify({ entity: `${r.entityType}:${r.entityId ?? ""}`, ip: r.ip, before: r.before, after: r.after }, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 text-sm">
            <button type="button" className="btn-secondary h-8" disabled={page === 1} onClick={() => setPage(page - 1)}>قبلی</button>
            <span>صفحه {fa(page)} از {fa(Math.max(1, Math.ceil(q.data.total / q.data.pageSize)))}</span>
            <button type="button" className="btn-secondary h-8" disabled={page * q.data.pageSize >= q.data.total} onClick={() => setPage(page + 1)}>بعدی</button>
          </div>
        </>
      )}
    </div>
  );
}
