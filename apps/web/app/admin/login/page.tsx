"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { Logo } from "@/components/logo";

export default function AdminLoginPage() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <form
        className="card w-full max-w-sm space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true); setError("");
          try {
            await api("/auth/admin/login", { method: "POST", body: { username: String(f.get("username") ?? ""), password: String(f.get("password") ?? "") } });
            qc.clear();
            window.location.assign("/admin"); // full load so no signed-out state is reused
          } catch (err) {
            setError(err instanceof ApiError ? (err.fields ? Object.values(err.fields)[0]?.[0] ?? err.message : err.message) : "خطای غیرمنتظره رخ داد.");
          } finally { setBusy(false); }
        }}
      >
        <div className="flex items-center justify-between"><Logo /><ShieldCheck className="size-5 text-brand-600" aria-hidden /></div>
        <div>
          <h1 className="text-lg font-extrabold">ورود مدیر پلتفرم</h1>
          <p className="text-sm text-ink-2">با نام کاربری و رمز عبور مدیریت وارد شوید.</p>
        </div>
        <div><label htmlFor="u" className="label">نام کاربری</label><input id="u" name="username" className="input" dir="ltr" autoComplete="username" autoCapitalize="none" required /></div>
        <div><label htmlFor="p" className="label">رمز عبور</label><input id="p" name="password" type="password" className="input" dir="ltr" autoComplete="current-password" required /></div>
        {error && <p role="alert" className="field-error">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" aria-hidden />}ورود</button>
      </form>
    </main>
  );
}
