"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/client/api";

/** Lets a signed-in user set a password, so they can later sign in with phone + password. */
export function SetPasswordCard() {
  const [password, setPassword] = useState("");
  const m = useMutation({ mutationFn: (p: string) => api("/auth/password/set", { method: "POST", body: { password: p } }), onSuccess: () => setPassword("") });
  const err = m.error as ApiError | null;
  return (
    <form className="card max-w-xl space-y-3" aria-labelledby="pw-title" onSubmit={(e) => { e.preventDefault(); m.mutate(password); }}>
      <h2 id="pw-title" className="card-title">رمز عبور</h2>
      <p className="text-sm text-ink-2">با تعیین رمز می‌توانید از صفحه‌ی ورود با «شماره و رمز عبور» هم وارد شوید. برای امنیت، تا ۱۰ دقیقه پس از ورود با کد پیامکی امکان تغییر رمز هست.</p>
      <label htmlFor="newpw" className="label">رمز جدید (حداقل ۸ کاراکتر)</label>
      <input id="newpw" type="password" autoComplete="new-password" dir="ltr" className="input text-left" value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p role="alert" className="field-error">{err.fields?.password?.[0] ?? err.message}</p>}
      {m.isSuccess && <p role="status" className="text-sm text-brand-700">رمز عبور ذخیره شد.</p>}
      <button className="btn-primary" disabled={m.isPending || password.length < 8}>ذخیره رمز</button>
    </form>
  );
}
