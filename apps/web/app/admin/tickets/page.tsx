"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/states";
import { TicketList, useTickets } from "@/components/tickets";

export default function AdminTickets() {
  const [status, setStatus] = useState("OPEN");
  const q = useTickets(`/admin/tickets${status ? `?status=${status}` : ""}`);
  return (
    <div className="space-y-6">
      <h1 className="page-title">تیکت‌های پشتیبانی</h1>
      <select className="input w-auto" aria-label="وضعیت" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="OPEN">در انتظار پاسخ</option>
        <option value="ANSWERED">پاسخ داده شده</option>
        <option value="CLOSED">بسته</option>
        <option value="">همه</option>
      </select>
      {q.isPending && <LoadingState />}
      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && <TicketList rows={q.data} hrefFor={(id) => `/admin/tickets/${id}`} empty="تیکتی نیست" meta={(r) => r.gym?.name} />}
    </div>
  );
}
