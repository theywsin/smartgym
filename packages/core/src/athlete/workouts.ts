import { withSystem, type Tx } from "@smartgym/db";
import type { WorkoutSetLogInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { type AthleteUser, memberMatch } from "./index";

/**
 * Athlete workout execution: weekly plan, sessions, set logging and the finish summary.
 * Every call re-checks that the member record belongs to the signed-in phone (see athlete/index.ts).
 * Sessions copy the day's exercises at start so editing the program later never rewrites history.
 */

type Exercise = { name: string; sets: number; reps: string; restSeconds?: number; note?: string; weightKg?: number; muscle?: string; imageUrl?: string; videoUrl?: string; tips?: string };
type Day = { title: string; weekday?: number; exercises: Exercise[] };

const TEHRAN_MS = 3.5 * 3600_000;
const DAY_MS = 86_400_000;
/** 0 = Saturday … 6 = Friday, in Tehran time. */
export function iranWeekday(d: Date): number {
  return (new Date(d.getTime() + TEHRAN_MS).getUTCDay() + 1) % 7;
}
/** Start (UTC instant) of the Tehran-local Saturday of d's week. */
export function iranWeekStart(d: Date): Date {
  const local = new Date(d.getTime() + TEHRAN_MS);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnight - iranWeekday(d) * DAY_MS - TEHRAN_MS);
}

/** Rough strength-training estimate: ~5 kcal per minute (shown as an estimate). */
const kcalEstimate = (minutes: number) => Math.round(minutes * 5);
const DEFAULT_REST = 90;

async function member(tx: Tx, user: AthleteUser, memberId: string) {
  const m = await tx.member.findFirst({ where: { id: memberId, ...memberMatch(user) }, select: { id: true, gymId: true, firstName: true } });
  if (!m) throw notFound("عضو");
  return m;
}

function summarize(exercises: Exercise[], logs: { exerciseIndex: number; reps: number; weightKgX10: number | null }[], startedAt: Date, finishedAt: Date | null, now: Date) {
  const minutes = Math.max(1, Math.round(((finishedAt ?? now).getTime() - startedAt.getTime()) / 60_000));
  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);
  const doneExercises = exercises.filter((e, i) => logs.filter((l) => l.exerciseIndex === i).length >= e.sets).length;
  return {
    minutes,
    exercisesDone: doneExercises,
    exercisesTotal: exercises.length,
    setsDone: logs.length,
    setsTotal: totalSets,
    totalReps: logs.reduce((a, l) => a + l.reps, 0),
    volumeKg: Math.round(logs.reduce((a, l) => a + l.reps * (l.weightKgX10 ?? 0), 0) / 10),
    kcal: kcalEstimate(minutes),
  };
}

const sessionView = (s: { id: string; dayIndex: number; dayTitle: string; exercises: unknown; startedAt: Date; finishedAt: Date | null; note: string | null; setLogs: { exerciseIndex: number; setNumber: number; reps: number; weightKgX10: number | null; note: string | null; loggedAt: Date }[] }, now: Date) => {
  const exercises = s.exercises as Exercise[];
  return {
    id: s.id, dayIndex: s.dayIndex, dayTitle: s.dayTitle, startedAt: s.startedAt, finishedAt: s.finishedAt, note: s.note,
    exercises: exercises.map((e) => ({ ...e, restSeconds: e.restSeconds ?? DEFAULT_REST })),
    sets: s.setLogs.map((l) => ({ exerciseIndex: l.exerciseIndex, setNumber: l.setNumber, reps: l.reps, weightKg: l.weightKgX10 == null ? null : l.weightKgX10 / 10, note: l.note, loggedAt: l.loggedAt })),
    summary: summarize(exercises, s.setLogs, s.startedAt, s.finishedAt, now),
  };
};

/** The active program laid out on the Iranian week, with this week's status per day. */
export async function athleteWorkoutWeek(deps: CoreDeps, user: AthleteUser, memberId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const m = await member(tx, user, memberId);
    const program = await tx.workoutProgram.findFirst({ where: { gymId: m.gymId, memberId: m.id, isActive: true }, select: { id: true, title: true, goal: true, notes: true, days: true, updatedAt: true } });
    const weekStart = iranWeekStart(now);
    const sessions = await tx.workoutSession.findMany({
      where: { gymId: m.gymId, memberId: m.id, startedAt: { gte: new Date(weekStart.getTime() - 28 * DAY_MS) } },
      orderBy: { startedAt: "desc" },
      include: { setLogs: { select: { exerciseIndex: true, reps: true, weightKgX10: true } } },
    });
    const today = iranWeekday(now);
    const open = sessions.find((s) => !s.finishedAt) ?? null;
    if (!program) return { program: null, today, week: [], openSessionId: open?.id ?? null, suggestedDayIndex: null, stats: null };
    const days = program.days as Day[];
    const thisWeek = sessions.filter((s) => s.startedAt >= weekStart);
    const scheduled = days.some((d) => d.weekday !== undefined);
    // Without fixed weekdays, suggest the day after the last finished one (rotation).
    const lastDone = sessions.find((s) => s.finishedAt);
    const suggestedDayIndex = scheduled
      ? (days.findIndex((d) => d.weekday === today) >= 0 ? days.findIndex((d) => d.weekday === today) : null)
      : lastDone ? (lastDone.dayIndex + 1) % days.length : 0;
    const week = Array.from({ length: 7 }, (_, wd) => {
      const dayIndex = scheduled ? days.findIndex((d) => d.weekday === wd) : -1;
      const done = thisWeek.find((s) => s.finishedAt && iranWeekday(s.startedAt) === wd);
      const state = done ? "DONE" : dayIndex < 0 ? (scheduled ? "REST" : "FREE") : wd < today ? "MISSED" : wd === today ? "TODAY" : "PLANNED";
      return { weekday: wd, date: new Date(weekStart.getTime() + wd * DAY_MS + TEHRAN_MS), dayIndex: dayIndex >= 0 ? dayIndex : done?.dayIndex ?? null, state, sessionId: done?.id ?? null };
    });
    const finishedThisWeek = thisWeek.filter((s) => s.finishedAt);
    const plannedPerWeek = scheduled ? days.filter((d) => d.weekday !== undefined).length : days.length;
    return {
      program: {
        id: program.id, title: program.title, goal: program.goal, notes: program.notes, updatedAt: program.updatedAt,
        days: days.map((d, i) => ({
          index: i, title: d.title, weekday: d.weekday ?? null, exercises: d.exercises.map((e) => ({ ...e, restSeconds: e.restSeconds ?? DEFAULT_REST })),
          setsTotal: d.exercises.reduce((a, e) => a + e.sets, 0),
          // ~45 s per set plus rest
          estMinutes: Math.round(d.exercises.reduce((a, e) => a + e.sets * (45 + (e.restSeconds ?? DEFAULT_REST)), 0) / 60),
        })),
      },
      today, week, openSessionId: open?.id ?? null, suggestedDayIndex,
      stats: {
        sessionsThisWeek: finishedThisWeek.length,
        plannedPerWeek,
        minutesThisWeek: finishedThisWeek.reduce((a, s) => a + Math.round((s.finishedAt!.getTime() - s.startedAt.getTime()) / 60_000), 0),
        adherencePct: plannedPerWeek ? Math.min(100, Math.round((finishedThisWeek.length / plannedPerWeek) * 100)) : 0,
        last28DaysSessions: sessions.filter((s) => s.finishedAt).length,
      },
    };
  });
}

/** Starts (or resumes) a session for a program day. Only one open session per athlete. */
export async function athleteStartWorkout(deps: CoreDeps, user: AthleteUser, memberId: string, dayIndex: number) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const m = await member(tx, user, memberId);
    await tx.$queryRaw`SELECT id FROM "member" WHERE id = ${m.id}::uuid FOR UPDATE`;
    const open = await tx.workoutSession.findFirst({ where: { gymId: m.gymId, memberId: m.id, finishedAt: null }, include: { setLogs: true } });
    if (open) {
      if (open.dayIndex === dayIndex) return sessionView(open, now);
      throw new AppError("BUSINESS_RULE", "یک تمرین نیمه‌تمام دارید. اول آن را تمام کنید.");
    }
    const program = await tx.workoutProgram.findFirst({ where: { gymId: m.gymId, memberId: m.id, isActive: true } });
    if (!program) throw new AppError("BUSINESS_RULE", "هنوز برنامه‌ی تمرینی برای شما ثبت نشده است.");
    const day = (program.days as Day[])[dayIndex];
    if (!day) throw notFound("روز تمرین");
    const s = await tx.workoutSession.create({
      data: { gymId: m.gymId, memberId: m.id, programId: program.id, dayIndex, dayTitle: day.title, exercises: day.exercises, startedAt: now },
      include: { setLogs: true },
    });
    return sessionView(s, now);
  });
}

async function ownSession(tx: Tx, user: AthleteUser, memberId: string, sessionId: string) {
  const m = await member(tx, user, memberId);
  const s = await tx.workoutSession.findFirst({ where: { id: sessionId, gymId: m.gymId, memberId: m.id }, include: { setLogs: { orderBy: [{ exerciseIndex: "asc" }, { setNumber: "asc" }] } } });
  if (!s) throw notFound("جلسه‌ی تمرین");
  return s;
}

export async function athleteGetWorkout(deps: CoreDeps, user: AthleteUser, memberId: string, sessionId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => sessionView(await ownSession(tx, user, memberId, sessionId), now));
}

/** Records (or corrects) one set. Same exercise + set number overwrites, so retries never duplicate. */
export async function athleteLogSet(deps: CoreDeps, user: AthleteUser, memberId: string, sessionId: string, input: WorkoutSetLogInput) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const s = await ownSession(tx, user, memberId, sessionId);
    if (s.finishedAt) throw new AppError("BUSINESS_RULE", "این تمرین تمام شده است.");
    const ex = (s.exercises as Exercise[])[input.exerciseIndex];
    if (!ex) throw notFound("حرکت");
    if (input.setNumber > ex.sets) throw new AppError("VALIDATION_FAILED", "شماره‌ی ست بیشتر از برنامه است.", { fields: { setNumber: ["نامعتبر"] } });
    const weightKgX10 = input.weightKg === undefined ? null : Math.round(input.weightKg * 10);
    await tx.workoutSetLog.upsert({
      where: { sessionId_exerciseIndex_setNumber: { sessionId: s.id, exerciseIndex: input.exerciseIndex, setNumber: input.setNumber } },
      create: { gymId: s.gymId, sessionId: s.id, exerciseIndex: input.exerciseIndex, setNumber: input.setNumber, reps: input.reps, weightKgX10, note: input.note ?? null, loggedAt: now },
      update: { reps: input.reps, weightKgX10, note: input.note ?? null, loggedAt: now },
    });
    return sessionView(await ownSession(tx, user, memberId, sessionId), now);
  });
}

export async function athleteFinishWorkout(deps: CoreDeps, user: AthleteUser, memberId: string, sessionId: string, note?: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const s = await ownSession(tx, user, memberId, sessionId);
    if (s.finishedAt) return sessionView(s, now); // idempotent
    if (!s.setLogs.length) throw new AppError("BUSINESS_RULE", "هنوز هیچ ستی ثبت نکرده‌اید.");
    await tx.workoutSession.update({ where: { id: s.id }, data: { finishedAt: now, note: note ?? null } });
    return sessionView(await ownSession(tx, user, memberId, sessionId), now);
  });
}

/** Leaves an unfinished session without saving it as done (logged sets are kept for the coach). */
export async function athleteAbandonWorkout(deps: CoreDeps, user: AthleteUser, memberId: string, sessionId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const s = await ownSession(tx, user, memberId, sessionId);
    if (s.finishedAt) return { ok: true };
    if (s.setLogs.length === 0) {
      // Nothing logged: close it with no sets so it shows nowhere as a workout.
      await tx.workoutSession.update({ where: { id: s.id }, data: { finishedAt: now, note: "لغو شد" } });
    } else {
      await tx.workoutSession.update({ where: { id: s.id }, data: { finishedAt: now, note: s.note ?? "نیمه‌تمام" } });
    }
    return { ok: true };
  });
}

export async function athleteWorkoutHistory(deps: CoreDeps, user: AthleteUser, memberId: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const m = await member(tx, user, memberId);
    const rows = await tx.workoutSession.findMany({
      where: { gymId: m.gymId, memberId: m.id, finishedAt: { not: null }, setLogs: { some: {} } },
      orderBy: { startedAt: "desc" }, take: 30, include: { setLogs: true },
    });
    return rows.map((s) => { const v = sessionView(s, now); return { id: v.id, dayTitle: v.dayTitle, startedAt: v.startedAt, finishedAt: v.finishedAt, note: v.note, summary: v.summary }; });
  });
}
