"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, X } from "lucide-react";
import { api } from "@/lib/client/api";
import { fa } from "@/lib/client/format";

const REFRESH_S = 60;

/** Full-screen check-in code. Rotates every minute; the server rejects codes older than 90 seconds. */
export function CheckinPass({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [left, setLeft] = useState(REFRESH_S);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { token } = await api<{ token: string }>(`/athlete/profiles/${memberId}/pass`, { method: "POST" });
        const s = await QRCode.toString(token, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
        if (!cancelled) { setSvg(s); setError(null); setLeft(REFRESH_S); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "خطا در دریافت کد");
      }
    };
    void load();
    const refresh = setInterval(load, REFRESH_S * 1000);
    const tick = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => { cancelled = true; clearInterval(refresh); clearInterval(tick); };
  }, [open, memberId]);

  if (!open)
    return (
      <button type="button" className="btn-primary h-12 w-full text-base" onClick={() => setOpen(true)}>
        <QrCode className="size-5" aria-hidden /> کد ورود به باشگاه
      </button>
    );
  return (
    <div role="dialog" aria-modal="true" aria-label="کد ورود" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white p-6">
      <button type="button" className="btn-ghost absolute top-4 left-4" onClick={() => { setOpen(false); setSvg(null); }} aria-label="بستن">
        <X className="size-5" aria-hidden />
      </button>
      <h2 className="text-lg font-extrabold">کد را به پذیرش نشان دهید</h2>
      {error ? (
        <p className="rounded-lg bg-err-bg p-3 text-sm text-err-tx">{error}</p>
      ) : svg ? (
        // eslint-disable-next-line react/no-danger -- SVG generated locally by the qrcode library
        <div className="w-full max-w-[300px]" data-testid="checkin-qr" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="aspect-square w-full max-w-[300px] animate-pulse rounded-xl bg-line-2" />
      )}
      <p className="text-sm text-ink-2">کد هر دقیقه عوض می‌شود ({fa(left)} ثانیه)</p>
    </div>
  );
}
