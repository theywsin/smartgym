import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text } from "../text";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { api, errorText } from "../api";
import { fa, jdate } from "../format";
import { Member } from "../screens/Member";
import { STATE_LABEL, type Membership } from "../screens/Profiles";
import {
  BackIcon, BellIcon, BulbIcon, CalendarIcon, CardIcon, CartIcon, ChartIcon, DumbbellIcon, FlameIcon, ForkIcon,
  GearIcon, HomeIcon, InfoIcon, LogoutIcon, TrophyIcon, UserIcon,
} from "./icons";
import { T, WEEKDAYS, WEEKDAYS_SHORT, shadow } from "./theme";
import { restTimer } from "./timer";
import type { HistoryRow, Week } from "./types";
import { Header, RestPanel, WorkoutTab, st } from "./Workout";

type Dashboard = {
  member: { id: string; code: number; firstName: string; lastName: string; gymName: string };
  membership: Membership;
  visitsLast30Days: number;
  coachName: string | null;
  profile: { phone: string | null; memberSince: string; homeBranch: string | null };
};

type Tab = "home" | "workout" | "nutrition" | "report" | "settings";
const TABS: { key: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { key: "home", label: "خانه", Icon: HomeIcon },
  { key: "workout", label: "تمرین", Icon: DumbbellIcon },
  { key: "nutrition", label: "تغذیه", Icon: ForkIcon },
  { key: "report", label: "گزارش", Icon: ChartIcon },
  { key: "settings", label: "تنظیمات", Icon: GearIcon },
];

const DAY = 86_400_000;
const IR = 3.5 * 3600e3;
/** Iran calendar day number (days since epoch in Tehran time). */
const irDay = (iso: string | number) => Math.floor((new Date(iso).getTime() + IR) / DAY);
const irWeekday = (t: number) => (new Date(t + IR).getUTCDay() + 1) % 7; // 0 = Saturday

/** Athlete app shell: bottom navigation, shared data, tabs. */
export function Athlete({ memberId, onSwitchGym, onLogout }: { memberId: string; onSwitchGym: () => void; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [week, setWeek] = useState<Week | null>(null);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState("");
  const [start, setStart] = useState<{ dayIndex: number; nonce: number } | null>(null);
  const [club, setClub] = useState(false);

  const load = useCallback(async () => {
    setError("");
    await Promise.all([
      api<Dashboard>(`/athlete/profiles/${memberId}`).then(setDash),
      api<Week>(`/athlete/profiles/${memberId}/workout`).then(setWeek),
      api<HistoryRow[]>(`/athlete/profiles/${memberId}/workout/history`).then(setHistory),
    ]).catch((e) => setError(errorText(e)));
  }, [memberId]);
  useEffect(() => { void load(); }, [load]);

  if (club) {
    return <View style={{ flex: 1, backgroundColor: T.bg }}><Member memberId={memberId} onBack={() => setClub(false)} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1 }}>
        {tab === "home" && <Home dash={dash} week={week} history={history} error={error} reload={load} onStart={(dayIndex) => { setStart({ dayIndex, nonce: Date.now() }); setTab("workout"); }} go={setTab} />}
        {tab === "workout" && <WorkoutTab memberId={memberId} week={week} reload={load} start={start} />}
        {tab === "nutrition" && <Nutrition />}
        {tab === "report" && <Report week={week} history={history} reload={load} />}
        {tab === "settings" && <Settings dash={dash} onClub={() => setClub(true)} onSwitchGym={onSwitchGym} onLogout={onLogout} />}
        {tab !== "workout" && <RestPanel compact />}
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

function Ring({ pct, size = 84, color = "#fff", track = "rgba(255,255,255,0.25)", text = "#fff" }: { pct: number; size?: number; color?: string; track?: string; text?: string }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={7} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={7} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - Math.min(1, pct / 100))} strokeLinecap="round" rotation={-90} origin={`${size / 2},${size / 2}`} />
      </Svg>
      <Text style={{ color: text, fontSize: 20, fontWeight: "900" }}>{fa(pct)}٪</Text>
    </View>
  );
}

/** Consecutive Iran days with a finished workout, ending today or yesterday. */
function streak(history: HistoryRow[] | null) {
  if (!history?.length) return 0;
  const days = new Set(history.map((h) => irDay(h.startedAt)));
  let d = irDay(Date.now());
  if (!days.has(d)) d -= 1;
  let n = 0;
  while (days.has(d)) { n++; d--; }
  return n;
}
const hm = (min: number) => `${fa(Math.floor(min / 60))}:${fa(String(min % 60).padStart(2, "0"))}`;

function Home({ dash, week, history, error, reload, onStart, go }: { dash: Dashboard | null; week: Week | null; history: HistoryRow[] | null; error: string; reload: () => Promise<void>; onStart: (dayIndex: number) => void; go: (t: Tab) => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const today = week?.program && week.suggestedDayIndex != null ? week.program.days[week.suggestedDayIndex] : null;
  const todayState = week?.week.find((d) => d.weekday === week.today)?.state;
  const stats = week?.stats;
  const weekKcal = useMemo(() => {
    const start = irDay(Date.now()) - irWeekday(Date.now());
    return (history ?? []).filter((h) => irDay(h.startedAt) >= start).reduce((a, h) => a + h.summary.kcal, 0);
  }, [history]);
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tehran" }).format(new Date()));
  const greet = hour < 12 ? "صبح بخیر" : hour < 17 ? "روز بخیر" : "عصر بخیر";
  const m = dash?.membership;
  const workoutSub = !week ? "" : !week.program ? "هنوز ثبت نشده" : todayState === "DONE" ? "امروز انجام شد ✓" : today ? (week.openSessionId ? "ادامه‌ی تمرین" : today.title) : "امروز استراحت";
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}>
      <ImageBackground source={require("../../assets/login-hero.jpg")} resizeMode="cover" style={s.hero} imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <View style={s.heroShade} />
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <View style={s.avatar}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>{dash?.member.firstName.slice(0, 1) ?? ""}</Text></View>
          <View style={s.bell} accessibilityLabel="اعلان‌ها"><BellIcon size={24} /></View>
        </View>
        <View style={{ marginTop: 34, gap: 4 }}>
          <Text style={s.hello}>سلام {dash?.member.firstName ?? ""} 👋</Text>
          <Text style={{ color: "rgba(255,255,255,0.88)", textAlign: "right", fontSize: 14 }}>{greet}، آماده‌ی یک روز عالی؟</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", textAlign: "right", fontSize: 12 }}>{WEEKDAYS[week?.today ?? 0]} · {jdate(new Date().toISOString())}</Text>
        </View>
        <View style={s.progress}>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <TrophyIcon size={26} color="#FDE68A" />
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900" }}>پیشرفت این هفته</Text>
            </View>
            <Text style={s.progTx}>{(stats?.adherencePct ?? 0) >= 50 ? "تا الان عالی عمل کردی!" : "با هم شروع کنیم، تو می‌تونی!"}</Text>
            <Text style={s.progTx}>{fa(stats?.sessionsThisWeek ?? 0)} از {fa(stats?.plannedPerWeek ?? 0)} جلسه انجام شد</Text>
          </View>
          <Ring pct={stats?.adherencePct ?? 0} />
        </View>
      </ImageBackground>

      <View style={{ padding: 16, gap: 14 }}>
        {error ? <Text style={st.err}>{error}</Text> : null}
        <View style={st.statsRow}>
          <MiniStat icon={<CalendarIcon size={24} />} value={fa(streak(history))} label="روز متوالی" />
          <MiniStat icon={<DumbbellIcon size={24} color={T.dark} />} value={hm(stats?.minutesThisWeek ?? 0)} label="مدت تمرین هفته" />
          <MiniStat icon={<FlameIcon size={24} />} value={fa(weekKcal)} label="کالری هفته" />
        </View>

        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <CalendarIcon size={20} color={T.ink} />
          <Text style={s.section}>برنامه امروز</Text>
        </View>
        <View style={{ flexDirection: "row-reverse", gap: 12 }}>
          <Pressable accessibilityRole="button" onPress={() => (today && todayState !== "DONE" && !week?.openSessionId ? onStart(today.index) : go("workout"))} style={[s.planCard, { backgroundColor: "#2563EB" }]}>
            <DumbbellIcon size={30} color="#fff" />
            <Text style={s.planTitle}>برنامه تمرینی</Text>
            <Text style={s.planSub} numberOfLines={1}>{workoutSub || "مشاهده برنامه"}</Text>
            <Text style={s.planLink}>‹ {today && todayState !== "DONE" ? (week?.openSessionId ? "ادامه" : "شروع تمرین") : "مشاهده برنامه"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => go("nutrition")} style={[s.planCard, { backgroundColor: "#7C3AED" }]}>
            <ForkIcon size={30} color="#fff" />
            <Text style={s.planTitle}>برنامه غذایی</Text>
            <Text style={s.planSub} numberOfLines={1}>به‌زودی</Text>
            <Text style={s.planLink}>‹ مشاهده برنامه</Text>
          </Pressable>
        </View>

        <View style={s.tip}>
          <BulbIcon size={30} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.h3}>{week?.program?.notes ? `نکته‌ی مربی${dash?.coachName ? ` (${dash.coachName})` : ""}:` : "نکته امروز:"}</Text>
            <Text style={st.body}>{week?.program?.notes || "💧 آب کافی بنوشید و قبل از تمرین بدن را گرم کنید."}</Text>
          </View>
        </View>

        {m && (
          <Pressable accessibilityRole="button" onPress={() => go("settings")} style={[st.card, { gap: 4 }]}>
            <View style={st.rowBetween}><Text style={st.h3}>اشتراک {dash?.member.gymName}</Text><Text style={[st.pill, m.state !== "active" && { backgroundColor: T.warnBg, color: T.warn }]}>{STATE_LABEL[m.state] ?? m.state}</Text></View>
            <Text style={st.muted}>{[m.planName, m.daysLeft != null ? `${fa(m.daysLeft)} روز مانده` : null, m.entriesLeft != null ? `${fa(m.entriesLeft)} جلسه مانده` : null].filter(Boolean).join(" · ") || "—"}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={[st.stat, shadow, { paddingVertical: 14 }]}>
      {icon}
      <Text style={{ fontSize: 20, fontWeight: "900", color: T.ink }}>{value}</Text>
      <Text style={{ fontSize: 11.5, color: T.ink2, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

/** Nutrition is phase 2: no fake meals, just an honest empty state in the final layout. */
function Nutrition() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Header title="برنامه غذایی امروز" icon={<ForkIcon color="#fff" />} />
      <View style={[st.card, { alignItems: "center", gap: 10, padding: 28 }]}>
        <View style={[s.emptyIcon, { backgroundColor: "#F3E8FF" }]}><ForkIcon size={36} color={T.purple} /></View>
        <Text style={st.h2}>برنامه‌ی غذایی هنوز ثبت نشده</Text>
        <Text style={[st.muted, { textAlign: "center" }]}>وقتی مربی برنامه‌ی غذایی شما را ثبت کند، وعده‌ها، کالری و تأیید هر وعده اینجا نمایش داده می‌شود.</Text>
      </View>
      <View style={[st.card, { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" }]}>
        <View style={[s.emptyIcon, { width: 44, height: 44, backgroundColor: T.purple }]}><CartIcon size={22} /></View>
        <View style={{ flex: 1 }}>
          <Text style={st.h3}>لیست خرید این هفته</Text>
          <Text style={st.muted}>بعد از ثبت برنامه‌ی غذایی، لیست خرید به‌صورت خودکار ساخته می‌شود.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

type Range = "week" | "month" | "all";
function Report({ week, history, reload }: { week: Week | null; history: HistoryRow[] | null; reload: () => Promise<void> }) {
  const [range, setRange] = useState<Range>("week");
  const [refreshing, setRefreshing] = useState(false);
  const data = useMemo(() => {
    const rows = history ?? [];
    const today = irDay(Date.now());
    if (range === "week") {
      const start = today - irWeekday(Date.now());
      const pts = Array.from({ length: 7 }, (_, i) => ({ label: WEEKDAYS_SHORT[i]!, v: 0 }));
      const inRange = rows.filter((h) => irDay(h.startedAt) >= start);
      inRange.forEach((h) => { pts[irDay(h.startedAt) - start]!.v += h.summary.minutes; });
      return { pts, rows: inRange, unit: "دقیقه تمرین در هر روز" };
    }
    if (range === "month") {
      const start = today - 27;
      const pts = Array.from({ length: 4 }, (_, i) => ({ label: `هفته ${fa(i + 1)}`, v: 0 }));
      const inRange = rows.filter((h) => irDay(h.startedAt) >= start);
      inRange.forEach((h) => { pts[Math.min(3, Math.floor((irDay(h.startedAt) - start) / 7))]!.v += h.summary.minutes; });
      return { pts, rows: inRange, unit: "دقیقه تمرین در هر هفته (۲۸ روز اخیر)" };
    }
    const pts = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.now() + IR); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - (5 - i));
      return { key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: new Intl.DateTimeFormat("fa-IR", { month: "short", timeZone: "UTC" }).format(d), v: 0 };
    });
    rows.forEach((h) => { const d = new Date(new Date(h.startedAt).getTime() + IR); const p = pts.find((x) => x.key === `${d.getUTCFullYear()}-${d.getUTCMonth()}`); if (p) p.v += h.summary.minutes; });
    return { pts, rows, unit: "دقیقه تمرین در هر ماه میلادی" };
  }, [history, range]);
  const kcal = data.rows.reduce((a, h) => a + h.summary.kcal, 0);
  const volume = data.rows.reduce((a, h) => a + h.summary.volumeKg, 0);
  const adherence = week?.stats?.adherencePct ?? 0;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}>
      <Header title="گزارش و پیشرفت" icon={<ChartIcon color="#fff" />} />
      <View style={s.segment} accessibilityRole="tablist">
        {([["week", "هفته جاری"], ["month", "ماهانه"], ["all", "کلی"]] as const).map(([k, l]) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: range === k }} onPress={() => setRange(k)} style={[s.segBtn, range === k && { backgroundColor: T.green }]}>
            <Text style={{ color: range === k ? "#fff" : T.ink2, fontWeight: "800" }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[st.card, { gap: 6 }]}>
        <Text style={st.muted}>{data.unit}</Text>
        <LineChart pts={data.pts} />
      </View>
      <View style={st.statsRow}>
        <MiniStat icon={<TrophyIcon size={24} />} value={`${fa(adherence)}٪`} label="تعهد به برنامه" />
        <MiniStat icon={<DumbbellIcon size={24} color="#2563EB" />} value={fa(data.rows.length)} label="جلسه تمرین" />
        <MiniStat icon={<FlameIcon size={24} />} value={fa(kcal)} label="کالری سوزانده" />
      </View>
      <View style={[st.card, st.rowBetween]}>
        <Text style={st.h3}>حجم کل جابه‌جا شده</Text>
        <Text style={[st.h3, { color: T.green }]}>{fa(volume)} کیلو</Text>
      </View>
      {data.rows.length > 0 ? (
        <View style={[st.card, { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: T.soft, borderColor: "#BBF7D0" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[st.h2, { color: T.green }]}>عالی هستی!</Text>
            <Text style={st.body}>هر جلسه تو را به هدفت نزدیک‌تر می‌کند.</Text>
          </View>
          <TrophyIcon size={44} />
        </View>
      ) : (
        <View style={[st.card, { alignItems: "center" }]}><Text style={st.muted}>در این بازه هنوز تمرینی ثبت نشده است.</Text></View>
      )}
    </ScrollView>
  );
}

function LineChart({ pts }: { pts: { label: string; v: number }[] }) {
  const [w, setW] = useState(0);
  const h = 170, padX = 18, padTop = 12, padBottom = 6;
  const max = Math.max(10, ...pts.map((p) => p.v));
  const nice = Math.ceil(max / 10) * 10;
  // RTL: first point on the right
  const xy = pts.map((p, i) => ({ x: w - padX - (i * (w - 2 * padX)) / Math.max(1, pts.length - 1), y: padTop + (1 - p.v / nice) * (h - padTop - padBottom) }));
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = xy.length ? `${line} L${xy[xy.length - 1]!.x},${h} L${xy[0]!.x},${h} Z` : "";
  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 30, height: h, justifyContent: "space-between", paddingTop: padTop - 7 }}>
          {[nice, nice / 2, 0].map((v) => <Text key={v} style={{ fontSize: 10, color: T.ink3 }}>{fa(v)}</Text>)}
        </View>
        <View style={{ flex: 1, height: h }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
          {w > 0 && (
            <Svg width={w} height={h}>
              <Defs><LinearGradient id="g" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={T.green2} stopOpacity={0.28} /><Stop offset="1" stopColor={T.green2} stopOpacity={0.02} /></LinearGradient></Defs>
              {[0, 0.5, 1].map((f) => <Line key={f} x1={0} x2={w} y1={padTop + f * (h - padTop - padBottom)} y2={padTop + f * (h - padTop - padBottom)} stroke={T.line} strokeWidth={1} />)}
              <Path d={area} fill="url(#g)" />
              <Path d={line} stroke={T.green} strokeWidth={3} fill="none" strokeLinejoin="round" />
              {xy.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={5} fill="#fff" stroke={T.green} strokeWidth={3} />)}
            </Svg>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row-reverse", marginLeft: 30 }}>
        {pts.map((p, i) => <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, color: T.ink2 }}>{p.label}</Text>)}
      </View>
    </View>
  );
}

function Settings({ dash, onClub, onSwitchGym, onLogout }: { dash: Dashboard | null; onClub: () => void; onSwitchGym: () => void; onLogout: () => void }) {
  const [sound, setSound] = useState(restTimer.sound);
  const [info, setInfo] = useState(false);
  const [about, setAbout] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}>
      <Header title="تنظیمات" />
      <View style={[st.card, { flexDirection: "row-reverse", alignItems: "center", gap: 14 }]}>
        <View style={[s.avatar, { width: 64, height: 64, borderRadius: 32, backgroundColor: T.dark, borderColor: T.green2 }]}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 24 }}>{dash?.member.firstName.slice(0, 1) ?? ""}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={st.h2}>{dash ? `${dash.member.firstName} ${dash.member.lastName}` : "…"}</Text>
          <Text style={st.muted}>{dash?.member.gymName} · کد عضویت {dash ? fa(dash.member.code) : ""}</Text>
        </View>
        <BackIcon left color={T.ink3} />
      </View>

      <MenuRow icon={<UserIcon color={T.ink} />} label="اطلاعات شخصی" open={info} onPress={() => setInfo((v) => !v)} />
      {info && (
        <View style={[st.card, { gap: 10, marginTop: -4 }]}>
          <Row k="شماره موبایل" v={dash?.profile.phone ? fa(dash.profile.phone.replace("+98", "0")) : "—"} />
          <Row k="مربی" v={dash?.coachName ?? "—"} />
          <Row k="شعبه" v={dash?.profile.homeBranch ?? "—"} />
          <Row k="عضو از" v={jdate(dash?.profile.memberSince)} />
        </View>
      )}
      <MenuRow icon={<CardIcon color={T.ink} />} label="اشتراک، حضور و پرداخت" onPress={onClub} />
      <View style={s.menu}>
        <BellIcon color={T.ink} />
        <Text style={s.menuTx}>صدای پایان استراحت</Text>
        <Switch value={sound} onValueChange={(v) => { setSound(v); restTimer.setSound(v); }} trackColor={{ true: T.green2, false: "#CBD5E1" }} />
      </View>
      <MenuRow icon={<HomeIcon color={T.ink} />} label="تغییر باشگاه" onPress={onSwitchGym} />
      <MenuRow icon={<InfoIcon />} label="درباره اپلیکیشن" open={about} onPress={() => setAbout((v) => !v)} />
      {about && <View style={[st.card, { marginTop: -4 }]}><Text style={st.muted}>اسمارت‌جیم · اپلیکیشن ورزشکار</Text></View>}
      <Pressable accessibilityRole="button" onPress={onLogout} style={[s.menu, { borderColor: "#FECACA", backgroundColor: T.errBg }]}>
        <LogoutIcon />
        <Text style={[s.menuTx, { color: T.err }]}>خروج از حساب کاربری</Text>
        <BackIcon left size={18} color={T.err} />
      </Pressable>
    </ScrollView>
  );
}

function MenuRow({ icon, label, onPress, open }: { icon: React.ReactNode; label: string; onPress: () => void; open?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={open != null ? { expanded: open } : undefined} onPress={onPress} style={s.menu}>
      {icon}
      <Text style={s.menuTx}>{label}</Text>
      <BackIcon left size={18} color={T.ink3} />
    </Pressable>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <View style={st.rowBetween}><Text style={st.muted}>{k}</Text><Text style={st.h3}>{v}</Text></View>
);

const s = StyleSheet.create({
  nav: { flexDirection: "row-reverse", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: T.line, paddingTop: 8, paddingBottom: 10, ...shadow },
  navItem: { flex: 1, alignItems: "center", gap: 3 },
  navIcon: { width: 44, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  navTx: { fontSize: 11, color: T.ink3 },
  hero: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18, backgroundColor: T.dark, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: "hidden" },
  heroShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(16,24,39,0.55)", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 2, borderColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  bell: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  hello: { color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "right" },
  progress: { marginTop: 20, flexDirection: "row-reverse", alignItems: "center", gap: 14, backgroundColor: T.green, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  progTx: { color: "rgba(255,255,255,0.92)", fontSize: 12.5, textAlign: "right" },
  section: { fontSize: 17, fontWeight: "900", color: T.ink, textAlign: "right" },
  planCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: "center", gap: 6, ...shadow },
  planTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },
  planSub: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  planLink: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 2 },
  tip: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#F1F5FF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#DBE4FF" },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  segment: { flexDirection: "row-reverse", gap: 8 },
  segBtn: { flex: 1, height: 44, borderRadius: 999, backgroundColor: "#EEF2F6", alignItems: "center", justifyContent: "center" },
  menu: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: T.line, paddingHorizontal: 16, height: 58, ...shadow },
  menuTx: { flex: 1, fontSize: 15, fontWeight: "800", color: T.ink, textAlign: "right" },
});
