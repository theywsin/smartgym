"use client";

import { useEffect, useRef, useState } from "react";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
declare global {
  interface Window { BarcodeDetector?: new (opts: { formats: string[] }) => Detector }
}

/** Camera QR reader using the browser's BarcodeDetector (Chrome, Edge, Android). */
export function QrScanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const cb = useRef(onCode);
  useEffect(() => { cb.current = onCode; }, [onCode]);

  useEffect(() => {
    if (!window.BarcodeDetector) {
      setError("این مرورگر اسکن با دوربین را پشتیبانی نمی‌کند. از Chrome یا دستگاه بارکدخوان استفاده کنید.");
      return;
    }
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        if (stopped) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (!video.current) return;
        video.current.srcObject = s;
        await video.current.play();
        timer = setInterval(async () => {
          if (!video.current || video.current.readyState < 2) return;
          const found = await detector.detect(video.current).catch(() => []);
          if (found[0]?.rawValue) cb.current(found[0].rawValue);
        }, 300);
      })
      .catch(() => setError("دسترسی به دوربین داده نشد."));
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) return <p className="rounded-lg bg-warn-bg p-3 text-sm text-warn-tx">{error}</p>;
  return <video ref={video} className="aspect-square w-full max-w-[320px] rounded-xl bg-black object-cover" muted playsInline aria-label="دوربین اسکن QR" />;
}
