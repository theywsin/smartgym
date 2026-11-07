"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { api } from "@/lib/client/api";
import { Logo } from "@/components/logo";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useMutation({ mutationFn: () => api("/auth/logout", { method: "POST" }), onSettled: () => router.replace("/login") });
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
        <Logo />
        <button type="button" className="btn-ghost text-sm text-err-tx" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut className="size-4" aria-hidden /> خروج
        </button>
      </header>
      <main className="mx-auto w-full max-w-[560px] px-4 py-6">{children}</main>
    </div>
  );
}
