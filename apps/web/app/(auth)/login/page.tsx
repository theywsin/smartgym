"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { formatIranMobile, toPersianDigits } from "@smartgym/shared";
import { iranMobile, otpCode } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { Logo } from "@/components/logo";

const phoneForm = z.object({ phone: iranMobile });
const codeForm = z.object({ code: otpCode });

type VerifyResult = { activeGymId: string | null; gyms: { id: string }[] };

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 shadow-[var(--shadow-2)] sm:p-8">
          {phone === null ? (
            <PhoneStep
              onSent={(p, wait) => {
                setPhone(p);
                setResendIn(wait);
              }}
            />
          ) : (
            <CodeStep
              phone={phone}
              resendIn={resendIn}
              onResent={(wait) => setResendIn(wait)}
              onBack={() => setPhone(null)}
              onVerified={(r) => {
                if (r.activeGymId) router.replace("/manager");
                else if (r.gyms.length > 1) router.replace("/select-gym");
                else router.replace("/onboarding");
              }}
            />
          )}
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-3">
          <ShieldCheck className="size-3.5" aria-hidden />
          ورود امن با کد یک‌بار مصرف پیامکی
        </p>
      </div>
    </main>
  );
}

function PhoneStep({ onSent }: { onSent: (phone: string, resendIn: number) => void }) {
  const form = useForm<z.input<typeof phoneForm>, unknown, z.output<typeof phoneForm>>({ resolver: zodResolver(phoneForm) });
  const [error, setError] = useState<string | null>(null);

  const submit = form.handleSubmit(async ({ phone }) => {
    setError(null);
    try {
      const r = await api<{ resendInSeconds: number }>("/auth/otp/request", { method: "POST", body: { phone, purpose: "LOGIN" } });
      onSent(phone, r.resendInSeconds);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "خطای غیرمنتظره‌ای رخ داد.");
    }
  });

  const fieldError = form.formState.errors.phone?.message;
  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-xl font-extrabold">ورود یا ثبت‌نام</h1>
      <p className="mt-1 mb-6 text-sm text-ink-2">شماره موبایل خود را وارد کنید تا کد تأیید برایتان پیامک شود.</p>
      <label htmlFor="phone" className="label">شماره موبایل</label>
      <input
        id="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
        className="input ltr-nums text-left"
        aria-invalid={!!fieldError}
        aria-describedby={fieldError ? "phone-error" : undefined}
        autoFocus
        {...form.register("phone")}
      />
      {fieldError && <p id="phone-error" className="field-error">{fieldError}</p>}
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-primary btn-lg mt-6 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        دریافت کد تأیید
      </button>
    </form>
  );
}

function CodeStep({
  phone,
  resendIn,
  onResent,
  onBack,
  onVerified,
}: {
  phone: string;
  resendIn: number;
  onResent: (wait: number) => void;
  onBack: () => void;
  onVerified: (r: VerifyResult) => void;
}) {
  const form = useForm<z.input<typeof codeForm>, unknown, z.output<typeof codeForm>>({ resolver: zodResolver(codeForm) });
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const submitted = useRef(false);

  const submit = form.handleSubmit(async ({ code }) => {
    setError(null);
    try {
      onVerified(await api<VerifyResult>("/auth/otp/verify", { method: "POST", body: { phone, code } }));
    } catch (e) {
      submitted.current = false;
      setError(e instanceof ApiError ? e.message : "خطای غیرمنتظره‌ای رخ داد.");
    }
  });

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      const r = await api<{ resendInSeconds: number }>("/auth/otp/request", { method: "POST", body: { phone, purpose: "LOGIN" } });
      onResent(r.resendInSeconds);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "خطای غیرمنتظره‌ای رخ داد.");
    } finally {
      setResending(false);
    }
  };

  const reg = form.register("code", {
    onChange: (e) => {
      const digits = String(e.target.value).replace(/[^\d۰-۹]/g, "");
      if (digits.length === 6 && !submitted.current) {
        submitted.current = true;
        void submit();
      }
    },
  });
  const fieldError = form.formState.errors.code?.message;

  return (
    <form onSubmit={submit} noValidate>
      <button type="button" onClick={onBack} className="btn-ghost -mr-3 mb-2 h-8 px-3 text-xs">
        <ArrowRight className="size-4" aria-hidden />
        تغییر شماره
      </button>
      <h1 className="text-xl font-extrabold">کد تأیید را وارد کنید</h1>
      <p className="mt-1 mb-6 text-sm text-ink-2">
        کد ۶ رقمی به شماره <span className="ltr-nums font-semibold text-ink">{toPersianDigits(formatIranMobile(phone))}</span> ارسال شد.
      </p>
      <label htmlFor="code" className="label">کد تأیید</label>
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        className="input ltr-nums text-center text-lg tracking-[0.5em]"
        aria-invalid={!!fieldError || !!error}
        autoFocus
        {...reg}
      />
      {fieldError && <p className="field-error">{fieldError}</p>}
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-primary btn-lg mt-6 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        تأیید و ورود
      </button>
      <div className="mt-4 text-center text-sm">
        {resendIn > 0 ? (
          <span className="text-ink-3">ارسال دوباره تا {toPersianDigits(resendIn)} ثانیه دیگر</span>
        ) : (
          <button type="button" className="font-semibold text-brand-700 hover:underline disabled:opacity-50" onClick={resend} disabled={resending}>
            ارسال دوباره کد
          </button>
        )}
      </div>
    </form>
  );
}
