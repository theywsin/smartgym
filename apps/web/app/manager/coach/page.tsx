"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toPersianDigits } from "@smartgym/shared";
import { api } from "@/lib/client/api";
import { jdate } from "@/lib/client/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { MembershipBadge, type MembershipSummary } from "@/components/membership-badge";

type Athlete = {
  memberId: string; code: number; firstName: string; lastName: string; since: string;
  membership: MembershipSummary; program: { title: string; updatedAt: string } | null;
};

export default function MyAthletesPage() {
  const q = useQuery({ queryKey: ["my-athletes"], queryFn: () => api<Athlete[]>("/coach/athletes") });
  const noProgram = q.data?.filter((a) => !a.program).length ?? 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">شاگردان من</h1>
        {q.data && q.data.length > 0 && (
          <p className="mt-1 text-sm text-ink-2">{toPersianDigits(q.data.length)} شاگرد{noProgram > 0 && `، ${toPersianDigits(noProgram)} نفر بدون برنامه‌ی تمرینی`}</p>
        )}
      </div>
      {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data!.length === 0 ? (
        <EmptyState title="هنوز شاگردی به شما سپرده نشده است" hint="مدیر یا پذیرش از پرونده‌ی عضو، مربی را تعیین می‌کند." />
      ) : (
        <ul className="card divide-y divide-line p-0">
          {q.data!.map((a) => (
            <li key={a.memberId}>
              <Link href={`/manager/coach/${a.memberId}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-canvas">
                <div className="min-w-0">
                  <p className="font-bold">{a.firstName} {a.lastName} <span className="text-xs font-normal text-ink-3">#{toPersianDigits(a.code)}</span></p>
                  <p className="mt-0.5 text-xs text-ink-2">
                    {a.program ? `برنامه: ${a.program.title} (به‌روز شده ${jdate(a.program.updatedAt)})` : <span className="text-warn-tx">بدون برنامه‌ی تمرینی</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MembershipBadge m={a.membership} />
                  <ChevronLeft className="size-4 text-ink-3" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
