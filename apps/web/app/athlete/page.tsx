"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronLeft } from "lucide-react";
import { api } from "@/lib/client/api";
import { fa } from "@/lib/client/format";
import { MembershipBadge, type MembershipSummary } from "@/components/membership-badge";
import { ErrorState, LoadingState } from "@/components/states";

export type Profile = { memberId: string; gymName: string; firstName: string; lastName: string; code: number; membership: MembershipSummary };

export default function AthleteHome() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["athlete-profiles"], queryFn: () => api<Profile[]>("/athlete/profiles") });
  useEffect(() => {
    if (q.data?.length === 1) router.replace(`/athlete/${q.data[0]!.memberId}`);
  }, [q.data, router]);

  if (q.isPending || q.data?.length === 1) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.data.length === 0)
    return (
      <div className="card p-6 text-center">
        <h1 className="mb-2 text-lg font-extrabold">پرونده‌ای پیدا نشد</h1>
        <p className="text-sm text-ink-2">با این شماره در هیچ باشگاهی عضو ثبت نشده است. از پذیرش باشگاه بخواهید شماره‌ی شما را در پرونده‌تان ثبت کند.</p>
        <Link href="/onboarding" className="btn-secondary mt-4 inline-flex">ثبت باشگاه جدید</Link>
      </div>
    );
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-extrabold">باشگاه‌های من</h1>
      <ul className="space-y-2">
        {q.data.map((p) => (
          <li key={p.memberId}>
            <Link href={`/athlete/${p.memberId}`} className="flex items-center gap-3 rounded-xl border border-line p-4 hover:border-brand-200 hover:bg-brand-50">
              <Building2 className="size-5 text-brand-700" aria-hidden />
              <span className="flex-1">
                <span className="block font-bold">{p.gymName}</span>
                <span className="text-xs text-ink-2">شماره عضویت {fa(p.code)}</span>
              </span>
              <MembershipBadge m={p.membership} />
              <ChevronLeft className="size-4 text-ink-3" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
