"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, ChevronLeft } from "lucide-react";
import { ROLE_LABELS_FA, type GymRole } from "@smartgym/shared";
import { api, type Me } from "@/lib/client/api";
import { Logo } from "@/components/logo";
import { ErrorState, LoadingState } from "@/components/states";

export default function SelectGymPage() {
  const router = useRouter();
  const me = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/auth/me") });
  const choose = useMutation({
    mutationFn: (gymId: string) => api("/auth/active-gym", { method: "POST", body: { gymId } }),
    onSuccess: () => router.replace("/manager"),
  });

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6">
          <h1 className="mb-4 text-xl font-extrabold">انتخاب باشگاه</h1>
          {me.isPending && <LoadingState />}
          {me.isError && <ErrorState error={me.error} onRetry={() => me.refetch()} />}
          {choose.isError && <ErrorState error={choose.error} />}
          <ul className="space-y-2">
            {me.data?.gyms.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => choose.mutate(g.id)}
                  disabled={choose.isPending}
                  className="flex w-full items-center gap-3 rounded-xl border border-line p-4 text-right hover:border-brand-200 hover:bg-brand-50"
                >
                  <Building2 className="size-5 text-brand-700" aria-hidden />
                  <span className="flex-1">
                    <span className="block font-bold">{g.name}</span>
                    <span className="text-xs text-ink-2">{g.roles.map((r) => ROLE_LABELS_FA[r as GymRole] ?? r).join("، ")}</span>
                  </span>
                  <ChevronLeft className="size-4 text-ink-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-secondary mt-4 w-full" onClick={() => router.push("/onboarding")}>
            ساخت باشگاه جدید
          </button>
        </div>
      </div>
    </main>
  );
}
