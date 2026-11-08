"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TICKET_CATEGORIES } from "@smartgym/validation";
import { ErrorState, LoadingState } from "@/components/states";
import { NewTicketForm, TicketList, useTickets } from "@/components/tickets";

export default function AthleteTickets() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const base = `/athlete/profiles/${memberId}/tickets`;
  const q = useTickets(base);
  return (
    <div className="space-y-4">
      <Link href={`/athlete/${memberId}`} className="text-xs text-ink-2">بازگشت</Link>
      <h1 className="text-xl font-extrabold">پیام به باشگاه</h1>
      <NewTicketForm endpoint={base} categories={TICKET_CATEGORIES.GYM} onCreated={(id) => router.push(`/athlete/${memberId}/tickets/${id}`)} />
      {q.isPending && <LoadingState />}
      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && <TicketList rows={q.data} hrefFor={(id) => `/athlete/${memberId}/tickets/${id}`} empty="هنوز پیامی نفرستاده‌اید" />}
    </div>
  );
}
