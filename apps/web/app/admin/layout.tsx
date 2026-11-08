"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { api, type Me } from "@/lib/client/api";
import { LoadingState } from "@/components/states";
import { Logo } from "@/components/logo";

const TABS = [
  ["/admin", "باشگاه‌ها"],
  ["/admin/plans", "پلن‌های اشتراک"],
  ["/admin/settings", "تنظیمات سایت"],
  ["/admin/tickets", "تیکت‌ها"],
  ["/admin/articles", "مقالات"],
  ["/admin/users", "کاربران"],
  ["/admin/audit", "گزارش ممیزی"],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const isLogin = path === "/admin/login";
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/auth/me"), enabled: !isLogin, retry: false });
  const allowed = !!me.data?.user.isAdminSession;
  useEffect(() => {
    if (!isLogin && (me.isError || (me.data && !allowed))) router.replace("/admin/login");
  }, [isLogin, me.isError, me.data, allowed, router]);
  const logout = useMutation({ mutationFn: () => api("/auth/logout", { method: "POST" }), onSettled: () => router.replace("/admin/login") });
  if (isLogin) return <>{children}</>;
  if (!allowed) return <LoadingState />;
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="chip border-ink-3 bg-line-2 font-semibold text-ink-2">مدیریت پلتفرم</span>
        </div>
        <button type="button" className="btn-ghost text-sm text-err-tx" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut className="size-4" aria-hidden /> خروج
        </button>
      </header>
      <nav aria-label="بخش‌های مدیریت" className="overflow-x-auto border-b border-line bg-white px-4 sm:px-8">
        <ul className="flex gap-1">
          {TABS.map(([href, label]) => {
            const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={`block whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${active ? "border-brand-600 text-brand-700" : "border-transparent text-ink-2 hover:text-ink"}`}>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
