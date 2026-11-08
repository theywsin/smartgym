import { useEffect, useState } from "react";
import { Platform, Vibration } from "react-native";

/**
 * Rest timer kept outside React so it survives screen changes. It stores the wall-clock end time and
 * recomputes the remaining time from Date.now(), so a delayed or throttled JS thread never drifts it.
 */
type State = { endAt: number | null; pausedLeftMs: number | null; totalMs: number; label: string; done: boolean };
let state: State = { endAt: null, pausedLeftMs: null, totalMs: 0, label: "", done: false };
const listeners = new Set<() => void>();
let ticker: ReturnType<typeof setInterval> | null = null;
let soundOn = true;

const emit = () => listeners.forEach((l) => l());
function beep() {
  if (!soundOn) return;
  try {
    if (Platform.OS === "web") {
      const Ctx = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [0, 0.25, 0.5].forEach((t) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.21);
      });
    } else {
      Vibration.vibrate([0, 400, 200, 400]);
    }
  } catch { /* sound is best effort */ }
}
function ensureTicker() {
  if (ticker) return;
  ticker = setInterval(() => {
    if (state.endAt && Date.now() >= state.endAt) {
      state = { ...state, endAt: null, pausedLeftMs: null, done: true };
      beep();
      emit();
    } else if (state.endAt) emit();
    if (!state.endAt) { clearInterval(ticker!); ticker = null; }
  }, 250);
}

export const restTimer = {
  start(seconds: number, label: string) { state = { endAt: Date.now() + seconds * 1000, pausedLeftMs: null, totalMs: seconds * 1000, label, done: false }; ensureTicker(); emit(); },
  pause() { if (state.endAt) { state = { ...state, pausedLeftMs: Math.max(0, state.endAt - Date.now()), endAt: null }; emit(); } },
  resume() { if (state.pausedLeftMs != null) { state = { ...state, endAt: Date.now() + state.pausedLeftMs, pausedLeftMs: null }; ensureTicker(); emit(); } },
  add(seconds: number) {
    if (state.endAt) state = { ...state, endAt: state.endAt + seconds * 1000, totalMs: state.totalMs + seconds * 1000 };
    else if (state.pausedLeftMs != null) state = { ...state, pausedLeftMs: state.pausedLeftMs + seconds * 1000, totalMs: state.totalMs + seconds * 1000 };
    emit();
  },
  skip() { state = { endAt: null, pausedLeftMs: null, totalMs: 0, label: "", done: false }; emit(); },
  dismiss() { state = { ...state, done: false }; emit(); },
  setSound(on: boolean) { soundOn = on; },
  get sound() { return soundOn; },
};

export function useRestTimer() {
  const [, force] = useState(0);
  useEffect(() => { const l = () => force((n) => n + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  const running = state.endAt != null;
  const paused = state.pausedLeftMs != null;
  const leftMs = running ? Math.max(0, state.endAt! - Date.now()) : paused ? state.pausedLeftMs! : 0;
  return { active: running || paused, running, paused, done: state.done, leftMs, totalMs: state.totalMs, label: state.label };
}

export const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
