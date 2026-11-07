"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { jdate, toman } from "@/lib/client/format";

type PublicPayment = {
  resNum: string; amountRial: string; status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  expiresAt: string; settledAt: string | null; rrn: string | null; failureReason: string | null;
  gymName: string; memberFirstName: string;
};

export default function PayPage() {
  return <Suspense><Pay /></Suspense>;
}

function Pay() {
  const { resNum } = useParams<{ resNum: string }>();
  const result = useSearchParams().get("result");
  const [leaving, setLeaving] = useState(false);
  const q = useQuery({ queryKey: ["pay", resNum], queryFn: () => api<PublicPayment>(`/public/pay/${resNum}`), retry: false });
  const start = useMutation({
    mutationFn: () => api<{ redirectUrl: string }>(`/public/pay/${resNum}/start`, { method: "POST" }),
    onSuccess: (r) => { setLeaving(true); window.location.assign(r.redirectUrl); },
  });
  const p = q.data;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-[420px] p-6 shadow-[var(--shadow-2)] sm:p-8">
        {q.isLoading && <p className="flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-4 animate-spin" aria-hidden />در حال بارگذاری…</p>}
        {q.error && (
          <div className="text-center">
            <XCircle className="mx-auto size-10 text-err-tx" aria-hidden />
            <h1 className="mt-3 text-lg font-extrabold">لینک پرداخت معتبر نیست</h1>
            <p className="mt-1 text-sm text-ink-2">لینک را دوباره از باشگاه بخواهید.</p>
          </div>
        )}
        {p && (
          <>
            <p className="text-sm text-ink-2">{p.gymName}</p>
            {p.status === "PAID" ? (
              <div className="mt-4 text-center">
                <CheckCircle2 className="mx-auto size-12 text-brand-700" aria-hidden />
                <h1 className="mt-3 text-xl font-extrabold">پرداخت با موفقیت انجام شد</h1>
                <p className="mt-2 text-2xl font-extrabold">{toman(p.amountRial)}</p>
                {p.rrn && <p className="mt-2 text-sm text-ink-2">شماره پیگیری: <span className="ltr-nums">{p.rrn}</span></p>}
                {p.settledAt && <p className="text-sm text-ink-2">تاریخ: {jdate(p.settledAt)}</p>}
              </div>
            ) : p.status === "PENDING" ? (
              <>
                <h1 className="mt-1 text-xl font-extrabold">{p.memberFirstName} عزیز، پرداخت بدهی</h1>
                <p className="mt-4 text-sm text-ink-2">مبلغ قابل پرداخت</p>
                <p className="text-3xl font-extrabold">{toman(p.amountRial)}</p>
                {result && result !== "paid" && (
                  <p role="alert" className="mt-4 rounded-lg bg-err-bg p-3 text-sm text-err-tx">پرداخت انجام نشد. اگر مبلغی از حساب شما کم شده باشد، تا ۷۲ ساعت به حساب برمی‌گردد. می‌توانید دوباره تلاش کنید.</p>
                )}
                <button type="button" className="btn-primary btn-lg mt-6 w-full" disabled={start.isPending || leaving} onClick={() => start.mutate()}>
                  {start.isPending || leaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CreditCard className="size-4" aria-hidden />}
                  پرداخت با درگاه بانک سامان
                </button>
                {start.error && <p role="alert" className="field-error">{(start.error as ApiError).message}</p>}
                <p className="mt-4 text-xs text-ink-3">مهلت این لینک تا {jdate(p.expiresAt)}</p>
              </>
            ) : (
              <div className="mt-4 text-center">
                <XCircle className="mx-auto size-10 text-err-tx" aria-hidden />
                <h1 className="mt-3 text-lg font-extrabold">{p.status === "EXPIRED" ? "این لینک منقضی شده است" : "این لینک دیگر قابل پرداخت نیست"}</h1>
                {p.failureReason && <p className="mt-2 text-sm text-ink-2">{p.failureReason}</p>}
                <p className="mt-1 text-sm text-ink-2">برای پرداخت، لینک جدید را از باشگاه بخواهید.</p>
              </div>
            )}
          </>
        )}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-3"><ShieldCheck className="size-3.5" aria-hidden />پرداخت امن از طریق شاپرک</p>
      </div>
    </main>
  );
}
