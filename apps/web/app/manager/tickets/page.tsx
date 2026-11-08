"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_CATEGORIES } from "@smartgym/validation";
import { ErrorState, LoadingState } from "@/components/states";
import { NewTicketForm, TicketList, useTickets } from "@/components/tickets";

export default function TicketsPage() {
  const router = useRouter();
  const [scope, setScope] = useState<"GYM" | "PLATFORM">("GYM");
  const q = useTickets(`/tickets?scope=${scope}`);
  return (
    <div className="space-y-6">
      <h1 className="page-title">تیکت‌ها</h1>
      <div role="tablist" className="flex gap-2">
        {([["GYM", "پیام‌های اعضا"], ["PLATFORM", "پشتیبانی اسمارت‌جیم"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={scope === k} type="button" className={scope === k ? "btn-primary h-9" : "btn-secondary h-9"} onClick={() => setScope(k)}>{l}</button>
        ))}
      </div>
      {scope === "PLATFORM" && <NewTicketForm endpoint="/tickets" categories={TICKET_CATEGORIES.PLATFORM} onCreated={(id) => router.push(`/manager/tickets/${id}`)} />}
      {q.isPending && <LoadingState />}
      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && <TicketList rows={q.data} hrefFor={(id) => `/manager/tickets/${id}`} empty={scope === "GYM" ? "عضوی تیکت نفرستاده است" : "تیکتی به پشتیبانی نفرستاده‌اید"} meta={(r) => r.memberName} />}
    </div>
  );
}
