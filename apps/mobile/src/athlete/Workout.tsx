import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { API_URL, api, errorText } from "../api";
import { fa, jdate, toLatin } from "../format";
import { BackIcon, BulbIcon, CalendarIcon, CheckIcon, ClockIcon, DumbbellIcon, PauseIcon, PlayIcon, TrophyIcon } from "./icons";
import { T, WEEKDAYS, WEEKDAYS_SHORT, shadow } from "./theme";
import { mmss, restTimer, useRestTimer } from "./timer";
const todayWeekday = () => (new Date(Date.now() + 3.5 * 3600e3).getUTCDay() + 1) % 7;
const jdateLong = () => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: "Asia/Tehran" }).format(new Date());
import type { Exercise, HistoryRow, ProgramDay, Session, Week } from "./types";

const media = (u?: string) => (u ? (u.startsWith("/") ? `${API_URL}${u}` : u) : undefined);
const firstNumber = (reps: string) => Number(toLatin(reps).match(/\d+/)?.[0] ?? 0);

type View_ = { name: "week" } | { name: "day"; dayIndex: number } | { name: "run"; sessionId: string } | { name: "done"; sessionId: string } | { name: "history" };

/** Workout tab: week plan → day → live session → finish summary. */
export function WorkoutTab({ memberId, week, reload, start }: { memberId: string; week: Week | null; reload: () => Promise<void>; start?: { dayIndex: number; nonce: number } | null }) {
  const [view, setView] = useState<View_>({ name: "week" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const begin = useCallback(async (dayIndex: number) => {
    setBusy(true); setError("");
    try {
      const s = await api<Session>(`/athlete/profiles/${memberId}/workout/sessions`, { method: "POST", body: { dayIndex } });
      setView({ name: "run", sessionId: s.id });
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }, [memberId]);

  // "Start workout" from the home screen
  useEffect(() => { if (start) void begin(start.dayIndex); }, [start, begin]);
  // Resume an unfinished session when opening the tab
  useEffect(() => { if (week?.openSessionId && view.name === "week") setView({ name: "run", sessionId: week.openSessionId }); }, [week?.openSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (view.name === "run") return <Run memberId={memberId} sessionId={view.sessionId} onFinished={() => { void reload(); setView({ name: "done", sessionId: view.sessionId }); }} onExit={() => { void reload(); setView({ name: "week" }); }} />;
  if (view.name === "done") return <Done memberId={memberId} sessionId={view.sessionId} onClose={() => setView({ name: "week" })} />;
  if (view.name === "history") return <History memberId={memberId} onBack={() => setView({ name: "week" })} />;
  if (!week) return <ActivityIndicator color={T.green} style={{ marginTop: 60 }} />;
  if (!week.program) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title="برنامه تمرینی" />
        <View style={[st.card, { alignItems: "center", gap: 8, padding: 28 }]}>
          <DumbbellIcon size={40} color={T.ink3} />
          <Text style={st.h2}>هنوز برنامه‌ای ندارید</Text>
          <Text style={[st.muted, { textAlign: "center" }]}>وقتی مربی برنامه‌ی تمرینی شما را ثبت کند، اینجا نمایش داده می‌شود.</Text>
        </View>
      </ScrollView>
    );
  }
  if (view.name === "day") {
    const day = week.program.days[view.dayIndex]!;
    return <DayDetail day={day} busy={busy} error={error} onBack={() => setView({ name: "week" })} onStart={() => begin(day.index)} />;
  }
  return <WeekView week={week} reload={reload} error={error} onDay={(i) => setView({ name: "day", dayIndex: i })} onHistory={() => setView({ name: "history" })} />;
}

export function Header({ title, onBack, right, icon }: { title: string; onBack?: () => void; right?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <View style={st.header}>
      <View style={st.headerSlot}>{icon ?? null}</View>
      <Text style={st.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={[st.headerSlot, { alignItems: "flex-start" }]}>
        {right ?? (onBack ? <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={onBack} hitSlop={12}><BackIcon left color="#fff" /></Pressable> : null)}
      </View>
    </View>
  );
}

const STATE: Record<string, { bg: string; fg: string; label: string }> = {
  DONE: { bg: T.green, fg: "#fff", label: "انجام شد" },
  TODAY: { bg: T.soft, fg: T.green, label: "امروز" },
  PLANNED: { bg: "#EFF6FF", fg: "#2563EB", label: "برنامه" },
  MISSED: { bg: T.errBg, fg: T.err, label: "انجام نشد" },
  REST: { bg: "#F1F5F9", fg: T.ink3, label: "استراحت" },
  FREE: { bg: "#F1F5F9", fg: T.ink3, label: "" },
};

function WeekView({ week, reload, error, onDay, onHistory }: { week: Week; reload: () => Promise<void>; error: string; onDay: (i: number) => void; onHistory: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const p = week.program!;
  const scheduled = p.days.some((d) => d.weekday != null);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}>
      <Header title="برنامه تمرینی" icon={<CalendarIcon color="#fff" />} right={<Pressable accessibilityRole="button" onPress={onHistory}><Text style={{ color: T.neon, fontWeight: "800" }}>سابقه</Text></Pressable>} />
      <View style={[st.card, { gap: 4 }]}>
        <Text style={st.h2}>{p.title}</Text>
        {p.goal ? <Text style={st.muted}>هدف: {p.goal}</Text> : null}
        {week.stats && <Text style={st.muted}>این هفته {fa(week.stats.sessionsThisWeek)} از {fa(week.stats.plannedPerWeek)} جلسه · {fa(week.stats.minutesThisWeek)} دقیقه</Text>}
      </View>
      {scheduled && (
        <View style={st.weekRow}>
          {week.week.map((d) => {
            const s = STATE[d.state]!;
            return (
              <Pressable key={d.weekday} accessibilityRole="button" accessibilityLabel={`${WEEKDAYS[d.weekday]} ${s.label}`} disabled={d.dayIndex == null} onPress={() => d.dayIndex != null && onDay(d.dayIndex)}
                style={[st.weekCell, { backgroundColor: s.bg }, d.weekday === week.today && { borderWidth: 2, borderColor: T.green }]}>
                <Text style={{ color: s.fg, fontWeight: "800", fontSize: 13 }}>{WEEKDAYS_SHORT[d.weekday]}</Text>
                <Text style={{ color: s.fg, fontSize: 11 }}>{jdate(d.date).slice(-2)}</Text>
                {d.state === "DONE" ? <CheckIcon size={14} /> : <View style={{ height: 14 }} />}
              </Pressable>
            );
          })}
        </View>
      )}
      {error ? <Text style={st.err}>{error}</Text> : null}
      {p.days.map((d) => {
        const isToday = week.suggestedDayIndex === d.index;
        return (
          <Pressable key={d.index} accessibilityRole="button" onPress={() => onDay(d.index)} style={[st.card, isToday && { borderColor: T.green2, borderWidth: 1.5 }]}>
            <View style={st.rowBetween}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <View style={st.badge}><Text style={{ color: T.green, fontWeight: "900" }}>{fa(d.index + 1)}</Text></View>
                <View>
                  <Text style={st.h3}>{d.title}</Text>
                  <Text style={st.muted}>{d.weekday != null ? WEEKDAYS[d.weekday] + " · " : ""}{fa(d.exercises.length)} حرکت · {fa(d.setsTotal)} ست · حدود {fa(d.estMinutes)} دقیقه</Text>
                </View>
              </View>
              {isToday && <Text style={st.pill}>{scheduled ? "امروز" : "نوبت بعدی"}</Text>}
            </View>
          </Pressable>
        );
      })}
      {p.notes ? (
        <View style={[st.card, { backgroundColor: T.warnBg, flexDirection: "row-reverse", gap: 8 }]}>
          <BulbIcon size={20} />
          <Text style={[st.body, { flex: 1 }]}>{p.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function DayDetail({ day, busy, error, onBack, onStart }: { day: ProgramDay; busy: boolean; error: string; onBack: () => void; onStart: () => void }) {
  const [open, setOpen] = useState<Exercise | null>(null);
  if (open) return <ExerciseDetail ex={open} onBack={() => setOpen(null)} />;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 10 }}>
        <Header title={day.title} onBack={onBack} icon={<CalendarIcon color="#fff" />} />
        <View style={st.todayBanner}><Text style={{ color: T.green, fontWeight: "900", fontSize: 14 }}>{day.weekday != null ? `روز برنامه: ${WEEKDAYS[day.weekday]}` : `امروز: ${WEEKDAYS[todayWeekday()]} ${jdateLong()}`}</Text></View>
        <View style={st.statsRow}>
          <Stat icon={<DumbbellIcon size={20} color={T.green} />} value={fa(day.exercises.length)} label="حرکت" />
          <Stat icon={<ClockIcon size={20} />} value={fa(day.setsTotal)} label="ست" />
          <Stat icon={<ClockIcon size={20} color="#2563EB" />} value={`~${fa(day.estMinutes)}`} label="دقیقه" />
        </View>
        {day.exercises.map((e, i) => (
          <Pressable key={i} accessibilityRole="button" onPress={() => setOpen(e)} style={[st.card, { flexDirection: "row-reverse", gap: 12, alignItems: "center" }]}>
            <View style={st.num}><Text style={{ color: "#fff", fontWeight: "900" }}>{fa(i + 1)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.h3}>{e.name}</Text>
              <Text style={st.muted}>{fa(e.sets)} ست × {fa(e.reps)} تکرار{e.weightKg != null ? ` · ${fa(e.weightKg)} کیلو` : ""} · استراحت {fa(e.restSeconds)} ثانیه</Text>
              {e.muscle ? <Text style={[st.muted, { color: T.green }]}>{e.muscle}</Text> : null}
            </View>
            {e.imageUrl ? <Image source={{ uri: media(e.imageUrl) }} style={st.thumb} /> : null}
          </Pressable>
        ))}
        {day.exercises.length > 0 && (
          <View style={[st.todayBanner, { flexDirection: "row-reverse", gap: 8, justifyContent: "center" }]}>
            <ClockIcon size={20} />
            <Text style={{ color: T.ink, fontWeight: "800", fontSize: 13 }}>بین هر ست {fa(day.exercises[0]!.restSeconds)} ثانیه استراحت کنید</Text>
          </View>
        )}
        {error ? <Text style={st.err}>{error}</Text> : null}
      </ScrollView>
      <View style={st.footer}>
        <Pressable accessibilityRole="button" onPress={onStart} disabled={busy} style={[st.primary, busy && { opacity: 0.7 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryTx}>شروع تمرین</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function ExerciseDetail({ ex, onBack }: { ex: Exercise; onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Header title={ex.name} onBack={onBack} />
      {ex.imageUrl ? <Image source={{ uri: media(ex.imageUrl) }} style={st.hero} resizeMode="cover" accessibilityLabel={`تصویر ${ex.name}`} /> : null}
      {ex.videoUrl ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(ex.videoUrl!)} style={[st.primary, { flexDirection: "row-reverse", gap: 8 }]}>
          <PlayIcon size={18} /><Text style={st.primaryTx}>پخش ویدئوی آموزشی</Text>
        </Pressable>
      ) : null}
      <View style={st.statsRow}>
        <Stat value={fa(ex.sets)} label="ست" />
        <Stat value={fa(ex.reps)} label="تکرار" />
        <Stat value={ex.weightKg != null ? fa(ex.weightKg) : "—"} label="کیلو" />
        <Stat value={fa(ex.restSeconds)} label="ثانیه استراحت" />
      </View>
      {ex.muscle ? <View style={st.card}><Text style={st.muted}>عضله‌ی هدف</Text><Text style={st.h3}>{ex.muscle}</Text></View> : null}
      {ex.note || ex.tips ? (
        <View style={[st.card, { gap: 6 }]}>
          <Text style={st.h3}>توضیحات حرکت</Text>
          {ex.note ? <Text style={st.body}>{ex.note}</Text> : null}
          {ex.tips?.split("\n").filter(Boolean).map((t, i) => (
            <View key={i} style={{ flexDirection: "row-reverse", gap: 6, alignItems: "flex-start" }}>
              <View style={{ marginTop: 3 }}><CheckIcon size={14} color={T.green} /></View><Text style={[st.body, { flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ icon, value, label }: { icon?: React.ReactNode; value: string; label: string }) {
  return (
    <View style={st.stat}>
      {icon}
      <Text style={{ fontSize: 18, fontWeight: "900", color: T.ink }}>{value}</Text>
      <Text style={{ fontSize: 11, color: T.ink2, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

/** Live session: one exercise at a time, log each set, rest timer starts automatically. */
function Run({ memberId, sessionId, onFinished, onExit }: { memberId: string; sessionId: string; onFinished: () => void; onExit: () => void }) {
  const base = `/athlete/profiles/${memberId}/workout/sessions/${sessionId}`;
  const [s, setS] = useState<Session | null>(null);
  const [idx, setIdx] = useState(0);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const timer = useRestTimer();

  useEffect(() => {
    api<Session>(base).then((x) => {
      setS(x);
      // jump to the first exercise with sets left
      const next = x.exercises.findIndex((e, i) => x.sets.filter((l) => l.exerciseIndex === i).length < e.sets);
      setIdx(next >= 0 ? next : 0);
    }).catch((e) => setError(errorText(e)));
  }, [base]);

  const ex = s?.exercises[idx];
  const doneSets = useMemo(() => (s ? s.sets.filter((l) => l.exerciseIndex === idx) : []), [s, idx]);
  const nextSet = doneSets.length + 1;
  useEffect(() => {
    if (!ex) return;
    const last = doneSets[doneSets.length - 1];
    setReps(String(last?.reps ?? firstNumber(ex.reps) ?? ""));
    setWeight(last?.weightKg != null ? String(last.weightKg) : ex.weightKg != null ? String(ex.weightKg) : "");
  }, [idx, ex, doneSets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s || !ex) return <View style={{ padding: 16 }}><Header title="تمرین" onBack={onExit} />{error ? <Text style={st.err}>{error}</Text> : <ActivityIndicator color={T.green} />}</View>;

  const allDone = s.exercises.every((e, i) => s.sets.filter((l) => l.exerciseIndex === i).length >= e.sets);
  const exDone = doneSets.length >= ex.sets;

  async function logSet() {
    const r = Number(toLatin(reps));
    if (!Number.isInteger(r) || r < 0 || r > 200) return setError("تعداد تکرار را درست وارد کنید.");
    const wRaw = toLatin(weight).replace(/[٫/,]/, ".").trim();
    const w = wRaw === "" ? undefined : Number(wRaw);
    if (w !== undefined && (!Number.isFinite(w) || w < 0 || w > 500)) return setError("وزنه را درست وارد کنید.");
    setBusy(true); setError("");
    try {
      const next = await api<Session>(`${base}/sets`, { method: "POST", body: { exerciseIndex: idx, setNumber: Math.min(nextSet, ex!.sets), reps: r, ...(w !== undefined && { weightKg: w }) } });
      setS(next);
      const left = ex!.sets - next.sets.filter((l) => l.exerciseIndex === idx).length;
      const more = next.exercises.some((e, i) => next.sets.filter((l) => l.exerciseIndex === i).length < e.sets);
      if (more && ex!.restSeconds > 0) restTimer.start(ex!.restSeconds, left > 0 ? `ست ${fa(nextSet + 1)} از ${fa(ex!.sets)}` : "حرکت بعدی");
      if (left <= 0) {
        const n = next.exercises.findIndex((e, i) => i > idx && next.sets.filter((l) => l.exerciseIndex === i).length < e.sets);
        if (n >= 0) setIdx(n);
      }
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  async function finish() {
    setBusy(true); setError("");
    try {
      await api(`${base}/finish`, { method: "POST", body: note.trim() ? { note: note.trim() } : {} });
      restTimer.skip();
      onFinished();
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  async function leave() {
    setBusy(true);
    try { await api(`${base}/abandon`, { method: "POST" }); restTimer.skip(); onExit(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  if (showInfo) return <ExerciseDetail ex={ex} onBack={() => setShowInfo(false)} />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: timer.active || timer.done ? 230 : 120, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Header title={s.dayTitle} onBack={() => setFinishing(true)} />
        {/* exercise strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: "row-reverse" }}>
          {s.exercises.map((e, i) => {
            const n = s.sets.filter((l) => l.exerciseIndex === i).length;
            const full = n >= e.sets;
            return (
              <Pressable key={i} accessibilityRole="tab" accessibilityState={{ selected: i === idx }} onPress={() => setIdx(i)}
                style={[st.chip, i === idx && { backgroundColor: T.green, borderColor: T.green }, full && i !== idx && { backgroundColor: T.soft }]}>
                <Text style={{ color: i === idx ? "#fff" : full ? T.green : T.ink2, fontWeight: "700", fontSize: 12 }}>{fa(i + 1)}. {e.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={st.statsRow}>
          <Stat icon={<ClockIcon size={18} color={T.ink2} />} value={`${fa(ex.restSeconds)} ث`} label="استراحت" />
          <Stat icon={<DumbbellIcon size={18} color={T.ink2} />} value={`${fa(Math.min(nextSet, ex.sets))} از ${fa(ex.sets)}`} label="ست" />
          <Stat value={ex.weightKg != null ? fa(ex.weightKg) : "—"} label="وزنه‌ی هدف (کیلو)" />
        </View>

        <View style={[st.card, { gap: 10 }]}>
          <Text style={[st.muted, { textAlign: "center" }]}>ست {fa(Math.min(nextSet, ex.sets))} از {fa(ex.sets)}</Text>
          <Text style={[st.h2, { textAlign: "center" }]}>{ex.name}</Text>
          {ex.imageUrl ? (
            <Pressable accessibilityRole="button" accessibilityLabel={ex.videoUrl ? "پخش ویدئوی حرکت" : "توضیحات حرکت"} onPress={() => (ex.videoUrl ? Linking.openURL(ex.videoUrl) : setShowInfo(true))}>
              <Image source={{ uri: media(ex.imageUrl) }} style={st.hero} resizeMode="cover" />
              {ex.videoUrl ? <View style={st.playBtn}><PlayIcon size={30} /></View> : null}
            </Pressable>
          ) : null}
          {ex.tips ? (
            <View style={{ gap: 6, paddingTop: 4 }}>
              <Text style={st.h3}>توضیحات حرکت:</Text>
              {ex.tips.split(/\n+/).filter((t) => t.trim()).map((t, k) => (
                <View key={k} style={{ flexDirection: "row-reverse", gap: 6, alignItems: "center" }}><CheckIcon size={16} color={T.green} /><Text style={[st.body, { flex: 1, fontSize: 13 }]}>{t.trim()}</Text></View>
              ))}
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setShowInfo(true)} style={{ alignSelf: "center" }}><Text style={{ color: T.green, fontWeight: "700" }}>{ex.videoUrl ? "ویدئو و توضیحات حرکت" : "توضیحات حرکت"}</Text></Pressable>
          )}
          <Text style={[st.muted, { textAlign: "center" }]}>هدف: {fa(ex.reps)} تکرار{ex.note ? ` · ${ex.note}` : ""}</Text>
          {/* set dots */}
          <View style={{ flexDirection: "row-reverse", justifyContent: "center", gap: 8 }}>
            {Array.from({ length: ex.sets }, (_, k) => {
              const l = doneSets.find((x) => x.setNumber === k + 1);
              return (
                <View key={k} style={[st.setDot, l && { backgroundColor: T.green, borderColor: T.green }]}>
                  <Text style={{ color: l ? "#fff" : T.ink3, fontSize: 11, fontWeight: "800" }}>{l ? fa(l.reps) : fa(k + 1)}</Text>
                </View>
              );
            })}
          </View>
          {!exDone ? (
            <>
              <View style={{ flexDirection: "row-reverse", gap: 10 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={st.label}>تکرار انجام‌شده</Text>
                  <TextInput accessibilityLabel="تکرار انجام‌شده" value={reps} onChangeText={setReps} keyboardType="number-pad" style={st.input} maxLength={3} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={st.label}>وزنه (کیلو)</Text>
                  <TextInput accessibilityLabel="وزنه" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="بدون وزنه" placeholderTextColor={T.ink3} style={st.input} maxLength={6} />
                </View>
              </View>
              <Pressable accessibilityRole="button" onPress={logSet} disabled={busy} style={[st.primary, busy && { opacity: 0.7 }]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryTx}>ثبت ست {fa(nextSet)}</Text>}
              </Pressable>
            </>
          ) : (
            <View style={[st.card, { backgroundColor: T.soft, alignItems: "center" }]}><Text style={{ color: T.green, fontWeight: "800" }}>همه‌ی ست‌های این حرکت ثبت شد ✓</Text></View>
          )}
          {doneSets.length > 0 && (
            <View style={{ gap: 4 }}>
              {doneSets.map((l) => <Text key={l.setNumber} style={st.muted}>ست {fa(l.setNumber)}: {fa(l.reps)} تکرار{l.weightKg != null ? ` × ${fa(l.weightKg)} کیلو` : ""}</Text>)}
            </View>
          )}
        </View>
        {error ? <Text style={st.err}>{error}</Text> : null}

        {(allDone || finishing) && (
          <View style={[st.card, { gap: 10 }]}>
            <Text style={st.h3}>{allDone ? "عالی! همه‌ی حرکات انجام شد" : "پایان تمرین"}</Text>
            <Text style={st.muted}>{fa(s.summary.setsDone)} از {fa(s.summary.setsTotal)} ست ثبت شده است.</Text>
            <TextInput accessibilityLabel="یادداشت برای مربی" value={note} onChangeText={setNote} placeholder="یادداشت برای مربی (اختیاری)" placeholderTextColor={T.ink3} style={[st.input, { minHeight: 70, textAlignVertical: "top" }]} multiline maxLength={1000} />
            <Pressable accessibilityRole="button" onPress={finish} disabled={busy || s.summary.setsDone === 0} style={[st.primary, (busy || s.summary.setsDone === 0) && { opacity: 0.6 }]}>
              <Text style={st.primaryTx}>ثبت و پایان تمرین</Text>
            </Pressable>
            {!allDone && (
              <View style={{ flexDirection: "row-reverse", gap: 10 }}>
                <Pressable accessibilityRole="button" onPress={() => setFinishing(false)} style={[st.ghost, { flex: 1 }]}><Text style={st.ghostTx}>ادامه‌ی تمرین</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={leave} disabled={busy} style={[st.ghost, { flex: 1, borderColor: T.err }]}><Text style={[st.ghostTx, { color: T.err }]}>خروج بدون ثبت</Text></Pressable>
              </View>
            )}
          </View>
        )}
        {!allDone && !finishing && (
          <Pressable accessibilityRole="button" onPress={() => setFinishing(true)} style={st.ghost}><Text style={st.ghostTx}>پایان تمرین</Text></Pressable>
        )}
      </ScrollView>
      <RestPanel />
    </View>
  );
}

/** Rest countdown docked at the bottom; driven by the wall-clock timer so it never drifts. */
export function RestPanel({ compact }: { compact?: boolean }) {
  const t = useRestTimer();
  if (!t.active && !t.done) return null;
  if (compact) {
    return (
      <View style={[st.restMini, t.done && { backgroundColor: T.green }]} accessibilityLiveRegion="polite">
        <ClockIcon size={20} color={t.done ? "#fff" : T.neon} />
        <Text style={{ flex: 1, color: "#fff", fontWeight: "800", textAlign: "right" }}>{t.done ? "استراحت تمام شد! ست بعدی" : `استراحت · ${fa(mmss(t.leftMs))}`}</Text>
        <Pressable accessibilityRole="button" onPress={() => (t.done ? restTimer.dismiss() : restTimer.skip())} hitSlop={8}><Text style={{ color: t.done ? "#fff" : T.neon, fontWeight: "800" }}>{t.done ? "باشه" : "رد کردن"}</Text></Pressable>
      </View>
    );
  }
  if (t.done) {
    return (
      <View style={[st.rest, { backgroundColor: T.green }]}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" }}>استراحت تمام شد! ست بعدی</Text>
        <Pressable accessibilityRole="button" onPress={() => restTimer.dismiss()} style={[st.restBtn, { backgroundColor: "#fff" }]}><Text style={{ color: T.green, fontWeight: "800" }}>باشه</Text></Pressable>
      </View>
    );
  }
  const r = 34, c = 2 * Math.PI * r;
  const frac = t.totalMs ? t.leftMs / t.totalMs : 0;
  return (
    <View style={st.rest} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 16 }}>
        <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
          <Svg width={84} height={84} style={{ position: "absolute" }}>
            <Circle cx={42} cy={42} r={r} stroke="#E2E8F0" strokeWidth={7} fill="none" />
            <Circle cx={42} cy={42} r={r} stroke={T.green} strokeWidth={7} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - frac)} strokeLinecap="round" rotation={-90} origin="42,42" />
          </Svg>
          <Pressable accessibilityRole="button" accessibilityLabel={t.paused ? "ادامه" : "توقف"} onPress={() => (t.paused ? restTimer.resume() : restTimer.pause())}>
            {t.paused ? <PlayIcon size={26} color={T.green} /> : <PauseIcon size={26} />}
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: T.ink2, textAlign: "right" }}>استراحت بین ست‌ها · {t.label}</Text>
          <Text style={{ fontSize: 40, fontWeight: "900", color: T.ink, textAlign: "right", fontVariant: ["tabular-nums"] }}>{fa(mmss(t.leftMs))}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row-reverse", gap: 8 }}>
        <Pressable accessibilityRole="button" onPress={() => restTimer.add(15)} style={[st.restBtn, { backgroundColor: T.soft }]}><Text style={{ color: T.green, fontWeight: "800" }}>+۱۵ ثانیه</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => restTimer.skip()} style={[st.restBtn, { backgroundColor: T.green }]}><Text style={{ color: "#fff", fontWeight: "800" }}>رد کردن استراحت</Text></Pressable>
      </View>
    </View>
  );
}

function Done({ memberId, sessionId, onClose }: { memberId: string; sessionId: string; onClose: () => void }) {
  const [s, setS] = useState<Session | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Session>(`/athlete/profiles/${memberId}/workout/sessions/${sessionId}`).then(setS).catch((e) => setError(errorText(e))); }, [memberId, sessionId]);
  if (!s) return <View style={{ padding: 16 }}>{error ? <Text style={st.err}>{error}</Text> : <ActivityIndicator color={T.green} />}</View>;
  const m = s.summary;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={[st.card, { backgroundColor: T.green, alignItems: "center", gap: 6, paddingVertical: 26 }]}>
        <TrophyIcon size={44} color="#FDE68A" />
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>تمرین با موفقیت ثبت شد!</Text>
        <Text style={{ color: "rgba(255,255,255,0.85)" }}>{s.dayTitle} · گزارش برای مربی ارسال شد</Text>
      </View>
      <View style={st.statsRow}>
        <Stat value={fa(m.minutes)} label="دقیقه" />
        <Stat value={`${fa(m.exercisesDone)} از ${fa(m.exercisesTotal)}`} label="حرکت" />
        <Stat value={`${fa(m.setsDone)} از ${fa(m.setsTotal)}`} label="ست" />
      </View>
      <View style={st.statsRow}>
        <Stat value={fa(m.totalReps)} label="مجموع تکرار" />
        <Stat value={fa(m.volumeKg)} label="حجم (کیلو)" />
        <Stat value={`~${fa(m.kcal)}`} label="کالری تخمینی" />
      </View>
      {s.note ? <View style={st.card}><Text style={st.muted}>یادداشت شما</Text><Text style={st.body}>{s.note}</Text></View> : null}
      <Pressable accessibilityRole="button" onPress={onClose} style={st.primary}><Text style={st.primaryTx}>بازگشت به برنامه</Text></Pressable>
    </ScrollView>
  );
}

function History({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<HistoryRow[]>(`/athlete/profiles/${memberId}/workout/history`).then(setRows).catch((e) => setError(errorText(e))); }, [memberId]);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Header title="سابقه‌ی تمرین" onBack={onBack} />
      {error ? <Text style={st.err}>{error}</Text> : null}
      {!rows && !error && <ActivityIndicator color={T.green} />}
      {rows?.length === 0 && <Text style={[st.muted, { textAlign: "center" }]}>هنوز تمرینی ثبت نکرده‌اید.</Text>}
      {rows?.map((r) => (
        <View key={r.id} style={st.card}>
          <View style={st.rowBetween}><Text style={st.h3}>{r.dayTitle}</Text><Text style={st.muted}>{jdate(r.startedAt)}</Text></View>
          <Text style={st.muted}>{fa(r.summary.minutes)} دقیقه · {fa(r.summary.setsDone)} ست · {fa(r.summary.totalReps)} تکرار · {fa(r.summary.volumeKg)} کیلو حجم</Text>
          {r.note ? <Text style={st.body}>{r.note}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

export const st = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginHorizontal: -16, marginTop: -16, marginBottom: 4, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 22, backgroundColor: T.dark, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  todayBanner: { backgroundColor: T.soft, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", borderWidth: 1, borderColor: "#BBF7D0" },
  playBtn: { position: "absolute", top: "50%", left: "50%", width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, backgroundColor: "rgba(16,24,39,0.75)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  headerSlot: { minWidth: 44, alignItems: "flex-end" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "900", color: "#fff", textAlign: "center" },
  card: { backgroundColor: T.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.line, ...shadow },
  h2: { fontSize: 19, fontWeight: "900", color: T.ink, textAlign: "right" },
  h3: { fontSize: 15, fontWeight: "800", color: T.ink, textAlign: "right" },
  body: { fontSize: 14, color: T.ink, textAlign: "right", lineHeight: 22 },
  muted: { fontSize: 12.5, color: T.ink2, textAlign: "right", lineHeight: 20 },
  label: { fontSize: 12, color: T.ink2, textAlign: "right" },
  err: { color: T.err, textAlign: "right", fontWeight: "600" },
  rowBetween: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", gap: 8 },
  weekRow: { flexDirection: "row-reverse", gap: 6 },
  weekCell: { flex: 1, borderRadius: 14, paddingVertical: 8, alignItems: "center", gap: 2 },
  badge: { width: 36, height: 36, borderRadius: 12, backgroundColor: T.soft, alignItems: "center", justifyContent: "center" },
  pill: { backgroundColor: T.soft, color: T.green, fontWeight: "800", fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  statsRow: { flexDirection: "row-reverse", gap: 8 },
  stat: { flex: 1, backgroundColor: T.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4, alignItems: "center", gap: 3, borderWidth: 1, borderColor: T.line },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: T.green, alignItems: "center", justifyContent: "center" },
  thumb: { width: 64, height: 56, borderRadius: 12, backgroundColor: "#F1F5F9" },
  hero: { width: "100%", aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: "#F1F5F9" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: "rgba(247,249,252,0.96)" },
  primary: { backgroundColor: T.green, borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center", shadowColor: T.green, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  primaryTx: { color: "#fff", fontSize: 16, fontWeight: "900" },
  ghost: { borderWidth: 1.5, borderColor: T.green, borderRadius: 16, height: 48, alignItems: "center", justifyContent: "center" },
  ghostTx: { color: T.green, fontWeight: "800" },
  chip: { borderWidth: 1, borderColor: T.line, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  setDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: T.line, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1, borderColor: T.line, borderRadius: 14, height: 52, paddingHorizontal: 14, fontSize: 20, color: T.ink, textAlign: "center", backgroundColor: "#fff" },
  rest: { position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: "#fff", borderRadius: 24, padding: 16, gap: 12, borderWidth: 1, borderColor: T.line, shadowColor: "#0f172a", shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  restMini: { position: "absolute", left: 12, right: 12, bottom: 10, flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: T.dark, borderRadius: 18, paddingHorizontal: 16, height: 52, ...shadow },
  restBtn: { flex: 1, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
