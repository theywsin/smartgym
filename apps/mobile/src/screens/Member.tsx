import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { API_URL, api, errorText } from "../api";
import { fa, jdate, toman } from "../format";
import { Btn, C, Card, ErrorText, Field, H, Loading, Row, T } from "../ui";
import { STATE_LABEL, type Membership } from "./Profiles";

type Exercise = { name: string; sets: number; reps: string; restSeconds?: number; note?: string };
type Dashboard = {
  member: { id: string; code: number; firstName: string; lastName: string; gymName: string };
  membership: Membership;
  visits: { id: string; checkedInAt: string; branchName: string }[];
  visitsLast30Days: number;
  program: { title: string; goal: string | null; notes: string | null; days: { title: string; exercises: Exercise[] }[] } | null;
  payments: { id: string; amountRial: string; refundedAmountRial: string; method: string; paidAt: string }[];
  debts: { subscriptionId: string; dueRial: string; planName: string }[];
  onlinePaymentEnabled: boolean;
  coachName: string | null;
};
type Ticket = { id: string; subject: string; status: string; lastMessageAt: string };
type Thread = Ticket & { messages: { id: string; side: string; body: string; createdAt: string; authorName: string | null }[] };

const TABS = [["home", "خلاصه"], ["pass", "ورود"], ["program", "برنامه"], ["money", "پرداخت"], ["support", "پشتیبانی"]] as const;
type Tab = (typeof TABS)[number][0];
const METHOD: Record<string, string> = { CASH: "نقدی", CARD_POS: "کارتخوان", TRANSFER: "کارت‌به‌کارت", ONLINE: "آنلاین" };
const TICKET_STATUS: Record<string, string> = { OPEN: "باز", ANSWERED: "پاسخ داده شد", CLOSED: "بسته" };

export function Member({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(() => api<Dashboard>(`/athlete/profiles/${memberId}`).then(setD).catch((e) => setError(errorText(e))), [memberId]);
  useEffect(() => { void load(); }, [load]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 4 }}>
        <Pressable accessibilityRole="button" onPress={onBack}><Text style={{ color: C.brand, textAlign: "right" }}>باشگاه‌های من ›</Text></Pressable>
        {d && <H size={20}>{d.member.firstName} {d.member.lastName}</H>}
        {d && <T muted>{d.member.gymName} · کد عضویت {fa(d.member.code)}</T>}
      </View>
      <View accessibilityRole="tablist" style={{ flexDirection: "row-reverse", gap: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
        {TABS.map(([k, label]) => (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} onPress={() => setTab(k)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: tab === k ? C.brand : "#fff", borderWidth: 1, borderColor: tab === k ? C.brand : C.line }}>
            <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "700", color: tab === k ? "#fff" : C.ink2 }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <ErrorText>{error}</ErrorText>
        {!d ? !error && <Loading /> : (
          <>
            {tab === "home" && <Home d={d} />}
            {tab === "pass" && <Pass memberId={memberId} active={d.membership.state === "active"} />}
            {tab === "program" && <Program d={d} />}
            {tab === "money" && <Money d={d} memberId={memberId} />}
            {tab === "support" && <Support memberId={memberId} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Home({ d }: { d: Dashboard }) {
  const m = d.membership;
  return (
    <>
      <Card style={{ backgroundColor: m.state === "active" ? C.okBg : "#fff" }}>
        <T muted>وضعیت اشتراک</T>
        <H size={22}>{STATE_LABEL[m.state] ?? m.state}</H>
        {m.planName && <Row k="پلن" v={m.planName} />}
        {m.daysLeft != null && <Row k="روز باقی‌مانده" v={fa(m.daysLeft)} />}
        {m.entriesLeft != null && <Row k="جلسه باقی‌مانده" v={fa(m.entriesLeft)} />}
        {m.endsAt && <Row k="پایان" v={jdate(m.endsAt)} />}
      </Card>
      <Card>
        <Row k="ورود در ۳۰ روز اخیر" v={`${fa(d.visitsLast30Days)} بار`} />
        {d.coachName && <Row k="مربی" v={d.coachName} />}
        {d.debts.length > 0 && <Row k="بدهی" v={<Text style={{ color: C.err }}>{toman(d.debts.reduce((a, x) => a + BigInt(x.dueRial), 0n).toString())}</Text>} />}
      </Card>
      <Card>
        <H size={16}>آخرین ورودها</H>
        {d.visits.length === 0 ? <T muted>هنوز ورودی ثبت نشده است.</T> : d.visits.slice(0, 8).map((v) => <Row key={v.id} k={v.branchName} v={jdate(v.checkedInAt, true)} />)}
      </Card>
    </>
  );
}

function Pass({ memberId, active }: { memberId: string; active: boolean }) {
  const [pass, setPass] = useState<{ token: string; expiresAt: string } | null>(null);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(0);
  const issue = useCallback(() => api<{ token: string; expiresAt: string }>(`/athlete/profiles/${memberId}/pass`, { method: "POST" }).then((p) => { setPass(p); setError(""); }).catch((e) => setError(errorText(e))), [memberId]);
  useEffect(() => { void issue(); }, [issue]);
  useEffect(() => {
    const t = setInterval(() => {
      if (!pass) return;
      const s = Math.round((new Date(pass.expiresAt).getTime() - Date.now()) / 1000);
      setLeft(Math.max(0, s));
      if (s <= 10) void issue(); // refresh before it expires
    }, 1000);
    return () => clearInterval(t);
  }, [pass, issue]);
  return (
    <Card style={{ alignItems: "center" }}>
      <H size={18}>کارت ورود</H>
      <T muted style={{ textAlign: "center" }}>این کد را جلوی دوربین پذیرش بگیرید. کد هر چند ثانیه عوض می‌شود و اسکرین‌شات آن کار نمی‌کند.</T>
      {!active && <T style={{ color: C.warn, textAlign: "center" }}>اشتراک فعالی ندارید. پذیرش ورود را ثبت نمی‌کند.</T>}
      <ErrorText>{error}</ErrorText>
      {pass ? <View style={{ padding: 12, backgroundColor: "#fff" }} accessibilityLabel="کد QR ورود"><QRCode value={pass.token} size={230} /></View> : !error && <Loading />}
      {pass && <T muted>اعتبار: {fa(left)} ثانیه</T>}
    </Card>
  );
}

function Program({ d }: { d: Dashboard }) {
  if (!d.program) return <Card><T>مربی هنوز برنامه‌ی تمرینی برای شما ثبت نکرده است.</T></Card>;
  const p = d.program;
  return (
    <>
      <Card>
        <H>{p.title}</H>
        {p.goal && <T muted>هدف: {p.goal}</T>}
        {p.notes && <T>{p.notes}</T>}
      </Card>
      {p.days.map((day, i) => (
        <Card key={i}>
          <H size={16}>{day.title}</H>
          {day.exercises.map((e, k) => (
            <View key={k} style={{ borderTopWidth: k ? 1 : 0, borderColor: C.line, paddingTop: k ? 8 : 0 }}>
              <Row k={e.name} v={`${fa(e.sets)} × ${fa(e.reps)}`} />
              {(e.restSeconds != null || e.note) && <T muted>{[e.restSeconds != null ? `استراحت ${fa(e.restSeconds)} ثانیه` : null, e.note].filter(Boolean).join(" · ")}</T>}
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}

function Money({ d, memberId }: { d: Dashboard; memberId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function pay(subscriptionId: string) {
    setBusy(subscriptionId); setError("");
    try {
      const r = await api<{ resNum: string }>(`/athlete/profiles/${memberId}/pay`, { method: "POST", body: { subscriptionId } });
      await Linking.openURL(`${API_URL}/pay/${r.resNum}`);
    } catch (e) { setError(errorText(e)); } finally { setBusy(null); }
  }
  return (
    <>
      {d.debts.map((x) => (
        <Card key={x.subscriptionId}>
          <Row k={x.planName} v={<Text style={{ color: C.err }}>{toman(x.dueRial)}</Text>} />
          {d.onlinePaymentEnabled ? <Btn title="پرداخت آنلاین" onPress={() => pay(x.subscriptionId)} busy={busy === x.subscriptionId} /> : <T muted>برای پرداخت به پذیرش باشگاه مراجعه کنید.</T>}
        </Card>
      ))}
      <ErrorText>{error}</ErrorText>
      <Card>
        <H size={16}>پرداخت‌های من</H>
        {d.payments.length === 0 ? <T muted>پرداختی ثبت نشده است.</T> : d.payments.map((p) => (
          <View key={p.id}>
            <Row k={`${jdate(p.paidAt)} · ${METHOD[p.method] ?? p.method}`} v={toman(p.amountRial)} />
            {p.refundedAmountRial !== "0" && <T muted>بازگشت: {toman(p.refundedAmountRial)}</T>}
          </View>
        ))}
      </Card>
    </>
  );
}

function Support({ memberId }: { memberId: string }) {
  const [list, setList] = useState<Ticket[] | null>(null);
  const [open, setOpen] = useState<Thread | null>(null);
  const [form, setForm] = useState<{ subject: string; body: string } | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = `/athlete/profiles/${memberId}/tickets`;
  const load = useCallback(() => api<Ticket[]>(base).then(setList).catch((e) => setError(errorText(e))), [base]);
  useEffect(() => { void load(); }, [load]);
  const run = async (f: () => Promise<void>) => { setBusy(true); setError(""); try { await f(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } };

  if (open) return (
    <>
      <Btn title="بازگشت به تیکت‌ها" kind="ghost" onPress={() => { setOpen(null); void load(); }} />
      <Card><H size={16}>{open.subject}</H><T muted>{TICKET_STATUS[open.status] ?? open.status}</T></Card>
      {open.messages.map((m) => (
        <Card key={m.id} style={{ backgroundColor: m.side === "REQUESTER" ? "#fff" : C.okBg }}>
          <T muted>{m.side === "REQUESTER" ? "شما" : m.authorName ?? "باشگاه"} · {jdate(m.createdAt, true)}</T>
          <T>{m.body}</T>
        </Card>
      ))}
      {open.status !== "CLOSED" && (
        <Card>
          <Field label="پاسخ شما" value={reply} onChangeText={setReply} multiline />
          <ErrorText>{error}</ErrorText>
          <Btn title="ارسال" busy={busy} onPress={() => run(async () => { setOpen(await api<Thread>(`${base}/${open.id}/reply`, { method: "POST", body: { body: reply } })); setReply(""); })} />
        </Card>
      )}
    </>
  );

  return (
    <>
      {form ? (
        <Card>
          <Field label="موضوع" value={form.subject} onChangeText={(subject) => setForm({ ...form, subject })} />
          <Field label="متن پیام" value={form.body} onChangeText={(body) => setForm({ ...form, body })} multiline />
          <ErrorText>{error}</ErrorText>
          <Btn title="ثبت تیکت" busy={busy} onPress={() => run(async () => { await api(base, { method: "POST", body: { ...form, category: "سایر" } }); setForm(null); await load(); })} />
          <Btn title="انصراف" kind="ghost" onPress={() => setForm(null)} />
        </Card>
      ) : <Btn title="تیکت جدید به باشگاه" onPress={() => setForm({ subject: "", body: "" })} />}
      {!list ? <Loading /> : list.length === 0 ? <Card><T muted>تیکتی ندارید.</T></Card> : list.map((t) => (
        <Pressable key={t.id} accessibilityRole="button" onPress={() => run(async () => setOpen(await api<Thread>(`${base}/${t.id}`)))}>
          <Card><Row k={t.subject} v={TICKET_STATUS[t.status] ?? t.status} /><T muted>{jdate(t.lastMessageAt, true)}</T></Card>
        </Pressable>
      ))}
    </>
  );
}
