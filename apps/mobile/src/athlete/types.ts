export type Exercise = { name: string; sets: number; reps: string; restSeconds: number; note?: string; weightKg?: number; muscle?: string; imageUrl?: string; videoUrl?: string; tips?: string; libraryId?: string };
export type ProgramDay = { index: number; title: string; weekday: number | null; exercises: Exercise[]; setsTotal: number; estMinutes: number };
export type WeekDay = { weekday: number; date: string; dayIndex: number | null; state: "DONE" | "REST" | "FREE" | "MISSED" | "TODAY" | "PLANNED"; sessionId: string | null };
export type Week = {
  program: { id: string; title: string; goal: string | null; notes: string | null; updatedAt: string; days: ProgramDay[] } | null;
  today: number;
  week: WeekDay[];
  openSessionId: string | null;
  suggestedDayIndex: number | null;
  stats: { sessionsThisWeek: number; plannedPerWeek: number; minutesThisWeek: number; adherencePct: number; last28DaysSessions: number } | null;
};
export type Summary = { minutes: number; exercisesDone: number; exercisesTotal: number; setsDone: number; setsTotal: number; totalReps: number; volumeKg: number; kcal: number };
export type SetLog = { exerciseIndex: number; setNumber: number; reps: number; weightKg: number | null; note: string | null; loggedAt: string };
export type Session = { id: string; dayIndex: number; dayTitle: string; startedAt: string; finishedAt: string | null; note: string | null; exercises: Exercise[]; sets: SetLog[]; summary: Summary };
export type HistoryRow = { id: string; dayTitle: string; startedAt: string; finishedAt: string; note: string | null; summary: Summary };
