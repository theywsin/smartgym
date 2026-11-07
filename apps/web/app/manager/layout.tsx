"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, CalendarCheck, ClipboardList, LayoutDashboard, LogOut, Menu, UserRound, Users, X } from "lucide-react";
import { formatIranMobile, toPersianDigits, ROLE_LABELS_FA, type GymRole } from "@smartgym/shared";
import { api, ApiError, type Me } from "@/lib/client/api";
import { Logo } from "@/components/logo";
import { ErrorState, LoadingState } from "@/components/states";
import { MeContext } from "@/lib/client/me";

const NAV = [
  { href: "/manager", label: "داشبورد", icon: LayoutDashboard, permission: null },
  { href: "/manager/members", label: "اعضا", icon: UserRound, permission: "members.read" },
  { href: "/manager/attendance", label: "حضور و غیاب", icon: CalendarCheck, permission: "attendance.read" },
  { href: "/manager/plans", label: "پلن‌های عضویت", icon: ClipboardList, permission: "members.read" },
  { href: "/manager/branches", label: "شعب", icon: Building2, permission: "branches.read" },
  { href: "/manager/staff", label: "کارکنان", icon: Users, permission: "staff.read" },
] as const;

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/auth/me") });
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSettled: () => router.replace("/login"),
  });

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.status === 401) router.replace("/login");
    if (me.data && !me.data.activeGymId) router.replace(me.data.gyms.length > 0 ? "/select-gym" : "/onboarding");
  }, [me.error, me.data, router]);
  useEffect(() => setOpen(false), [pathname]);

  if (me.isPending || (me.data && !me.data.access)) return <LoadingState />;
  if (me.isError) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      </div>
    );
  }

  const data = me.data!;
  const access = data.access!;
  const gym = data.gyms.find((g) => g.id === data.activeGymId);
  const perms = new Set(access.permissions);
  const nav = NAV.filter((n) => n.permission === null || perms.has(n.permission));
  const roleLabel = access.roles.map((r) => ROLE_LABELS_FA[r as GymRole] ?? r).join("، ");

  const sidebar = (
    <nav aria-label="منوی اصلی" className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-2">
        <Logo />
      </div>
      <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-ink-3">مدیریت باشگاه</p>
      {nav.map((n) => (
        <Link key={n.href} href={n.href} className="nav-item" aria-current={pathname === n.href || (n.href !== "/manager" && pathname.startsWith(`${n.href}/`)) ? "page" : undefined}>
          <n.icon className="size-[18px]" aria-hidden />
          {n.label}
        </Link>
      ))}
      <div className="mt-auto border-t border-line pt-3">
        <div className="px-3 pb-2 text-xs text-ink-2">
          <p className="ltr-nums font-semibold text-ink">{toPersianDigits(formatIranMobile(data.user.phone))}</p>
          <p>{roleLabel}</p>
        </div>
        <button type="button" className="nav-item w-full text-err-tx hover:bg-err-bg" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut className="size-[18px]" aria-hidden />
          خروج
        </button>
      </div>
    </nav>
  );

  return (
    <MeContext.Provider value={data}>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-[264px] flex-none border-l border-line bg-white lg:block">{sidebar}</aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="منو">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 right-0 w-[264px] bg-white shadow-[var(--shadow-3)]">
              <button type="button" className="btn-ghost absolute top-4 left-3 size-9 px-0" onClick={() => setOpen(false)} aria-label="بستن منو">
                <X className="size-5" aria-hidden />
              </button>
              {sidebar}
            </aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
            <button type="button" className="btn-ghost size-10 px-0 lg:hidden" onClick={() => setOpen(true)} aria-label="باز کردن منو">
              <Menu className="size-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{gym?.name}</p>
            </div>
            {access.gymStatus === "TRIAL" && <span className="chip-brand">دوره آزمایشی</span>}
            {access.gymStatus === "SUSPENDED" && <span className="chip border-[#fecaca] bg-err-bg text-err-tx">تعلیق‌شده</span>}
            {data.gyms.length > 1 && (
              <Link href="/select-gym" className="btn-secondary h-9 px-3 text-xs">
                تغییر باشگاه
              </Link>
            )}
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </MeContext.Provider>
  );
}
