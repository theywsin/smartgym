"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarCheck, CheckCircle2, Circle, Hourglass, UserRound, Users } from "lucide-react";
import { toPersianDigits } from "@smartgym/shared";
import { api } from "@/lib/client/api";
import { useCan, useMe } from "@/lib/client/me";
import { ErrorState, LoadingState } from "@/components/states";

type Branch = { id: string; name: string };
type Staff = { userId: string; role: string };
type MemberCounts = { total: number; counts: { all: number; active: number; expiring: number; expired: number; suspended: number } };
type Plan = { id: string };
type Day = { total: number; inside: number };

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tehran" }).format(new Date()));
  if (h < 12) return "صبح بخیر";
  if (h < 17) return "ظهر بخیر";
  return "عصر بخیر";
}

/**
 * Dashboard: only real data (members, attendance, branches, staff). Revenue cards arrive with the
 * finance module; nothing here is mocked.
 */
export default function ManagerDashboard() {
  const me = useMe();
  const canBranches = useCan("branches.read");
  const canStaff = useCan("staff.read");
  const branches = useQuery({ queryKey: ["branches"], queryFn: () => api<Branch[]>("/branches"), enabled: canBranches });
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => api<Staff[]>("/users/staff"), enabled: canStaff });

  const canMembers = useCan("members.read");
  const canAttendance = useCan("attendance.read");
  const members = useQuery({ queryKey: ["members", "dashboard"], queryFn: () => api<MemberCounts>("/members?pageSize=1"), enabled: canMembers });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => api<Plan[]>("/memberships/plans"), enabled: canMembers });
  const today = useQuery({ queryKey: ["attendance", "dashboard"], queryFn: () => api<Day>("/attendance?pageSize=1"), enabled: canAttendance });

  const name = me.user.firstName ?? "";
  const loading =
    (canBranches && branches.isPending) || (canStaff && staff.isPending) || (canMembers && members.isPending) || (canAttendance && today.isPending);
  const error = branches.error ?? staff.error ?? members.error ?? today.error;

  const steps = [
    { done: true, label: "ساخت باشگاه", href: null },
    { done: (branches.data?.length ?? 0) > 0, label: "تعریف شعبه", href: "/manager/branches", show: canBranches },
    { done: (staff.data?.length ?? 0) > 1, label: "افزودن همکاران (پذیرش، مربی، مدیر شعبه)", href: "/manager/staff", show: canStaff },
    { done: (plans.data?.length ?? 0) > 0, label: "تعریف پلن‌های عضویت", href: "/manager/plans", show: canMembers },
    { done: (members.data?.counts.all ?? 0) > 0, label: "ثبت اولین عضو و فروش اشتراک", href: "/manager/members/new", show: canMembers },
  ].filter((s) => s.show !== false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          {greeting()}
          {name && `، ${name}`}
        </h1>
        <p className="text-sm text-ink-2">نمای کلی باشگاه شما</p>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={() => { void branches.refetch(); void staff.refetch(); void members.refetch(); void today.refetch(); }} />}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {canMembers && (
              <Kpi href="/manager/members" icon={<UserRound className="size-5" aria-hidden />} tone="bg-brand-50 text-brand-700" label="اعضای فعال" value={members.data?.counts.active} />
            )}
            {canMembers && (
              <Kpi href="/manager/members" icon={<Hourglass className="size-5" aria-hidden />} tone="bg-warn-bg text-warn-tx" label="رو به اتمام (۷ روز)" value={members.data?.counts.expiring} />
            )}
            {canAttendance && (
              <Kpi href="/manager/attendance" icon={<CalendarCheck className="size-5" aria-hidden />} tone="bg-info-bg text-info-tx" label="ورود امروز" value={today.data?.total} />
            )}
            {canBranches && (
              <Link href="/manager/branches" className="card flex items-center gap-4 hover:border-brand-200">
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Building2 className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm text-ink-2">شعبه‌های فعال</p>
                  <p className="text-2xl font-extrabold">{toPersianDigits(branches.data?.length ?? 0)}</p>
                </div>
              </Link>
            )}
            {canStaff && (
              <Link href="/manager/staff" className="card flex items-center gap-4 hover:border-brand-200">
                <div className="flex size-11 items-center justify-center rounded-xl bg-info-bg text-info-tx">
                  <Users className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm text-ink-2">کارکنان</p>
                  <p className="text-2xl font-extrabold">{toPersianDigits(staff.data?.length ?? 0)}</p>
                </div>
              </Link>
            )}
          </div>

          <section className="card" aria-labelledby="setup-title">
            <h2 id="setup-title" className="card-title mb-4">راه‌اندازی باشگاه</h2>
            <ol className="space-y-3">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="size-5 text-brand-600" aria-label="انجام شد" />
                  ) : (
                    <Circle className="size-5 text-ink-3" aria-label="انجام نشده" />
                  )}
                  {s.href && !s.done ? (
                    <Link href={s.href} className="font-semibold text-brand-700 hover:underline">{s.label}</Link>
                  ) : (
                    <span className={s.done ? "text-ink-2" : ""}>{s.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ href, icon, tone, label, value }: { href: string; icon: React.ReactNode; tone: string; label: string; value: number | undefined }) {
  return (
    <Link href={href} className="card flex items-center gap-4 hover:border-brand-200">
      <div className={`flex size-11 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      <div>
        <p className="text-sm text-ink-2">{label}</p>
        <p className="text-2xl font-extrabold">{toPersianDigits(value ?? 0)}</p>
      </div>
    </Link>
  );
}
