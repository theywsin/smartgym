"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { api } from "@/lib/client/api";
import { Logo } from "@/components/logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useMutation({ mutationFn: () => api("/auth/logout", { method: "POST" }), onSettled: () => router.replace("/login") });
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
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
