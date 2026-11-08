"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { registerGymSchema } from "@smartgym/validation";
import { api, ApiError } from "@/lib/client/api";
import { Logo } from "@/components/logo";

type FormIn = z.input<typeof registerGymSchema>;
type FormOut = z.output<typeof registerGymSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(registerGymSchema),
    defaultValues: { firstBranchName: "شعبه اصلی" },
  });
  const errors = form.formState.errors;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api("/auth/register-gym", { method: "POST", body: values });
      router.replace("/manager");
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        for (const [k, v] of Object.entries(e.fields)) form.setError(k as keyof FormIn, { message: v[0] });
      }
      setError(e instanceof ApiError ? e.message : "خطای غیرمنتظره‌ای رخ داد.");
    }
  });

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form onSubmit={submit} noValidate className="card space-y-5 p-6 shadow-[var(--shadow-2)] sm:p-8">
          <div>
            <h1 className="text-xl font-extrabold">باشگاه خود را بسازید</h1>
            <p className="mt-1 text-sm text-ink-2">دوره‌ی آزمایشی رایگان. بعداً می‌توانید شعبه‌ها و همکاران را اضافه کنید.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="label">نام شما</label>
              <input id="firstName" className="input" autoComplete="given-name" {...form.register("firstName", { setValueAs: (v) => v || undefined })} />
            </div>
            <div>
              <label htmlFor="lastName" className="label">نام خانوادگی</label>
              <input id="lastName" className="input" autoComplete="family-name" {...form.register("lastName", { setValueAs: (v) => v || undefined })} />
            </div>
          </div>
          <div>
            <label htmlFor="name" className="label">نام باشگاه</label>
            <input id="name" className="input" placeholder="مثلاً باشگاه آرین" aria-invalid={!!errors.name} {...form.register("name")} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="firstBranchName" className="label">نام اولین شعبه</label>
            <input id="firstBranchName" className="input" aria-invalid={!!errors.firstBranchName} {...form.register("firstBranchName")} />
            {errors.firstBranchName && <p className="field-error">{errors.firstBranchName.message}</p>}
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          <button type="submit" className="btn-primary btn-lg w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            ساخت باشگاه و شروع دوره آزمایشی
          </button>
        </form>
      </div>
    </main>
  );
}
