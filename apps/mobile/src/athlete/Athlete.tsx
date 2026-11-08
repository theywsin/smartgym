import { useCallback, useEffect, useState } from "react";
import { ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { api, errorText } from "../api";
import { fa, jdate } from "../format";
import { Member } from "../screens/Member";
import { STATE_LABEL, type Membership } from "../screens/Profiles";
import { BulbIcon, CalendarIcon, CardIcon, ClockIcon, DumbbellIcon, FlameIcon, HomeIcon, PlayIcon, TrophyIcon, UserIcon } from "./icons";
import { T, WEEKDAYS, shadow } from "./theme";
import { restTimer } from "./timer";
import type { Week } from "./types";
import { Header, RestPanel, WorkoutTab, st } from "./Workout";

type Dashboard = {
  member: { id: string; code: number; firstName: string; lastName: string; gymName: string };
  membership: Membership;
  visitsLast30Days: number;
  coachName: string | null;
  profile: { phone: string | null; memberSince: string; homeBranch: string | null };
};

type Tab = "home" | "workout" | "club" | "profile";
const TABS: { key: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { key: "home", label: "خانه", Icon: HomeIcon },
  { key: "workout", label: "تمرین", Icon: DumbbellIcon },
  { key: "club", label: "باشگاه", Icon: CardIcon },
  { key: "profile", label: "پروفایل", Icon: UserIcon },
];

/** Athlete app shell: bottom navigation, shared data, tabs. */
export function Athlete({ memberId, onSwitchGym, onLogout }: { memberId: string; onSwitchGym: () => void; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [week, setWeek] = useState<Week | null>(null);
  const [error, setError] = useState("");
  const [start, setStart] = useState<{ dayIndex: number; nonce: number } | null>(null);

  const load = useCallback(async () => {
    setError("");
    await Promise.all([
      api<Dashboard>(`/athlete/profiles/${memberId}`).then(setDash),
      api<Week>(`/athlete/profiles/${memberId}/workout`).then(setWeek),
    ]).catch((e) => setError(errorText(e)));
  }, [memberId]);
  useEffect(() => { void load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1 }}>
        {tab === "home" && <Home dash={dash} week={week} error={error} reload={load} onStart={(dayIndex) => { setStart({ dayIndex, nonce: Date.now() }); setTab("workout"); }} onWorkout={() => setTab("workout")} />}
        {tab === "workout" && <WorkoutTab memberId={memberId} week={week} reload={load} start={start} />}
        {tab === "club" && <Member memberId={memberId} onBack={onSwitchGym} />}
        {tab === "profile" && <Profile dash={dash} onSwitchGym={onSwitchGym} onLogout={onLogout} />}
        {tab !== "workout" && <RestPanel />}
      </View>
      <View style={s.nav} accessibilityRole="tablist">
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={() => setTab(key)} style={s.navItem}>
              <View style={[s.navIcon, active && { backgroundColor: T.soft }]}><Icon size={22} color={active ? T.green : T.ink3} /></View>
              <Text style={[s.navTx, active && { color: T.green, fontWeight: "800" }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Ring({ pct, size = 86 }: { pct: number; size?: number }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={7} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth={7} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" rotation={-90} origin={`${size / 2},${size / 2}`} />
      </Svg>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>{fa(pct)}٪</Text>
    </View>
  );
}

function Home({ dash, week, error, reload, onStart, onWorkout }: { dash: Dashboard | null; week: Week | null; error: string; reload: () => Promise<void>; onStart: (dayIndex: number) => void; onWorkout: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const today = week?.program && week.suggestedDayIndex != null ? week.program.days[week.suggestedDayIndex] : null;
  const todayState = week?.week.find((d) => d.weekday === week.today)?.state;
  const stats = week?.stats;
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tehran" }).format(new Date()));
  const greet = hour < 12 ? "صبح بخیر" : hour < 17 ? "روز بخیر" : "عصر بخیر";
  const m = dash?.membership;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}>
      <ImageBackground source={require("../../assets/login-hero.jpg")} resizeMode="cover" style={s.hero} imageStyle={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={s.heroShade} />
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <View style={s.avatar}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>{dash?.member.firstName.slice(0, 1) ?? ""}</Text></View>
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{jdate(new Date().toISOString())} · {WEEKDAYS[week?.today ?? 0]}</Text>
        </View>
        <View style={{ marginTop: 18, gap: 4 }}>
          <Text style={s.hello}>سلام {dash?.member.firstName ?? ""} 👋</Text>
          <Text style={{ color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{greet}، آماده‌ی یک روز عالی؟</Text>
        </View>
        <View style={s.progress}>
          <Ring pct={stats?.adherencePct ?? 0} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <TrophyIcon size={22} color="#FDE68A" />
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>پیشرفت این هفته</Text>
            </View>
            <Text style={s.progTx}>{fa(stats?.sessionsThisWeek ?? 0)} از {fa(stats?.plannedPerWeek ?? 0)} جلسه انجام شد</Text>
            <Text style={s.progTx}>باقی‌مانده: {fa(Math.max(0, (stats?.plannedPerWeek ?? 0) - (stats?.sessionsThisWeek ?? 0)))} جلسه · ۲۸ روز اخیر: {fa(stats?.last28DaysSessions ?? 0)}</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={{ padding: 16, gap: 14 }}>
        {error ? <Text style={st.err}>{error}</Text> : null}
        <View style={st.statsRow}>
          <MiniStat icon={<FlameIcon size={22} />} value={fa(stats?.minutesThisWeek ?? 0)} label="دقیقه تمرین هفته" />
          <MiniStat icon={<DumbbellIcon size={22} color={T.green} />} value={fa(stats?.sessionsThisWeek ?? 0)} label="جلسه این هفته" />
          <MiniStat icon={<CalendarIcon size={22} />} value={fa(dash?.visitsLast30Days ?? 0)} label="حضور در ۳۰ روز" />
        </View>

        <Text style={s.section}>برنامه امروز</Text>
        {!week ? null : !week.program ? (
          <View style={st.card}><Text style={st.muted}>مربی هنوز برنامه‌ی تمرینی برای شما ثبت نکرده است.</Text></View>
        ) : today ? (
          <View style={[s.todayCard]}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              <View style={s.todayIcon}><DumbbellIcon size={26} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900", textAlign: "right" }}>{today.title}</Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", textAlign: "right" }}>{fa(today.exercises.length)} حرکت · {fa(today.setsTotal)} ست · حدود {fa(today.estMinutes)} دقیقه</Text>
              </View>
            </View>
            {todayState === "DONE" ? (
              <View style={s.todayBtn}><Text style={{ color: T.green, fontWeight: "900" }}>تمرین امروز انجام شد ✓</Text></View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => (week.openSessionId ? onWorkout() : onStart(today.index))} style={s.todayBtn}>
                <PlayIcon size={18} color={T.green} />
                <Text style={{ color: T.green, fontWeight: "900", fontSize: 15 }}>{week.openSessionId ? "ادامه‌ی تمرین" : "شروع تمرین"}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={onWorkout} style={[st.card, { flexDirection: "row-reverse", alignItems: "center", gap: 10 }]}>
            <ClockIcon size={24} color={T.ink3} />
            <View style={{ flex: 1 }}><Text style={st.h3}>امروز روز استراحت است</Text><Text style={st.muted}>برنامه‌ی هفته را در تب تمرین ببینید.</Text></View>
          </Pressable>
        )}

        {week?.program?.notes ? (
          <View style={[st.card, { backgroundColor: T.warnBg, borderColor: "#FDE68A", flexDirection: "row-reverse", gap: 10 }]}>
            <BulbIcon size={24} />
            <View style={{ flex: 1 }}><Text style={st.h3}>پیام مربی{dash?.coachName ? ` (${dash.coachName})` : ""}</Text><Text style={st.body}>{week.program.notes}</Text></View>
          </View>
        ) : null}

        {m && (
          <View style={[st.card, { gap: 4 }]}>
            <View style={st.rowBetween}><Text style={st.h3}>اشتراک باشگاه</Text><Text style={[st.pill, m.state !== "active" && { backgroundColor: T.warnBg, color: T.warn }]}>{STATE_LABEL[m.state] ?? m.state}</Text></View>
            <Text style={st.muted}>{[m.planName, m.daysLeft != null ? `${fa(m.daysLeft)} روز مانده` : null, m.entriesLeft != null ? `${fa(m.entriesLeft)} جلسه مانده` : null].filter(Boolean).join(" · ") || "—"}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={[st.stat, shadow]}>
      {icon}
      <Text style={{ fontSize: 19, fontWeight: "900", color: T.ink }}>{value}</Text>
      <Text style={{ fontSize: 11, color: T.ink2, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

function Profile({ dash, onSwitchGym, onLogout }: { dash: Dashboard | null; onSwitchGym: () => void; onLogout: () => void }) {
  const [sound, setSound] = useState(restTimer.sound);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Header title="پروفایل" />
      <View style={[st.card, { flexDirection: "row-reverse", alignItems: "center", gap: 12 }]}>
        <View style={[s.avatar, { backgroundColor: T.green }]}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}>{dash?.member.firstName.slice(0, 1) ?? ""}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={st.h2}>{dash ? `${dash.member.firstName} ${dash.member.lastName}` : "…"}</Text>
          <Text style={st.muted}>{dash?.member.gymName} · کد عضویت {dash ? fa(dash.member.code) : ""}</Text>
        </View>
      </View>
      <View style={[st.card, { gap: 10 }]}>
        <Row k="شماره موبایل" v={dash?.profile.phone ? fa(dash.profile.phone.replace("+98", "0")) : "—"} />
        <Row k="مربی" v={dash?.coachName ?? "—"} />
        <Row k="شعبه" v={dash?.profile.homeBranch ?? "—"} />
        <Row k="عضو از" v={jdate(dash?.profile.memberSince)} />
      </View>
      <View style={[st.card, { gap: 6 }]}>
        <View style={st.rowBetween}>
          <Text style={st.h3}>صدای پایان استراحت</Text>
          <Switch value={sound} onValueChange={(v) => { setSound(v); restTimer.setSound(v); }} trackColor={{ true: T.green2, false: "#CBD5E1" }} />
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onSwitchGym} style={st.ghost}><Text style={st.ghostTx}>تغییر باشگاه</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onLogout} style={[st.ghost, { borderColor: T.err }]}><Text style={[st.ghostTx, { color: T.err }]}>خروج از حساب کاربری</Text></Pressable>
    </ScrollView>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={st.rowBetween}><Text style={st.muted}>{k}</Text><Text style={st.h3}>{v}</Text></View>
);

const s = StyleSheet.create({
  nav: { flexDirection: "row-reverse", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: T.line, paddingTop: 8, paddingBottom: 10, ...shadow },
  navItem: { flex: 1, alignItems: "center", gap: 3 },
  navIcon: { width: 46, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  navTx: { fontSize: 11.5, color: T.ink3 },
  hero: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18, backgroundColor: T.dark, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  heroShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(16,24,39,0.62)", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 2, borderColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  hello: { color: "#fff", fontSize: 26, fontWeight: "900", textAlign: "right" },
  progress: { marginTop: 18, flexDirection: "row-reverse", alignItems: "center", gap: 14, backgroundColor: T.green, borderRadius: 22, padding: 14 },
  progTx: { color: "rgba(255,255,255,0.9)", fontSize: 12.5, textAlign: "right" },
  section: { fontSize: 17, fontWeight: "900", color: T.ink, textAlign: "right" },
  todayCard: { backgroundColor: "#2563EB", borderRadius: 22, padding: 16, gap: 14, ...shadow },
  todayIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  todayBtn: { backgroundColor: "#fff", borderRadius: 14, height: 46, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
});
