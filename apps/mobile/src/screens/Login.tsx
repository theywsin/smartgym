import { useState } from "react";
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../text";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { api, errorText, saveTokens } from "../api";
import { normalizePhone, toLatin } from "../format";

const G = { green: "#22c55e", green2: "#16a34a", dark: "#0b1210", ink: "#111827", ink2: "#4b5563", ink3: "#9ca3af", line: "#e5e7eb", err: "#dc2626" };
const HERO_H = 380;

/** Brand mark: a bold "S" with a dumbbell plate, drawn so it stays sharp at any size. */
function Mark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size * 1.5} height={size} viewBox="0 0 96 64">
      <Defs>
        <LinearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#4ade80" /><Stop offset="1" stopColor="#16a34a" /></LinearGradient>
      </Defs>
      <Path d="M58 6H28C16 6 9 13 9 22c0 9 6 14 17 15l14 1c4 0 6 2 6 5s-3 5-7 5H6L0 58h40c13 0 21-7 21-17 0-9-6-14-17-15l-14-1c-4 0-6-2-6-4 0-3 2-4 6-4h22z" fill="url(#mg)" />
      <Rect x="66" y="16" width="7" height="32" rx="3" fill="url(#mg)" />
      <Rect x="76" y="22" width="6" height="20" rx="3" fill="url(#mg)" />
      <Rect x="85" y="27" width="5" height="10" rx="2.5" fill="url(#mg)" />
    </Svg>
  );
}

function PhoneIcon({ color = G.ink3, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill={color} />
    </Svg>
  );
}
function MobileIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Rect x="6" y="2" width="12" height="20" rx="3" stroke={G.green2} strokeWidth={2.2} fill="none" />
      <Rect x="10" y="17" width="4" height="1.8" rx="0.9" fill={G.green2} />
    </Svg>
  );
}
function Dumbbell() {
  return (
    <Svg width={48} height={24} viewBox="0 0 48 24">
      {[[2, 7, 10], [8, 3, 18], [36, 3, 18], [42, 7, 10]].map(([x, y, h], i) => <Rect key={i} x={x} y={y} width={4} height={h} rx={2} fill="#cbd5e1" />)}
      <Rect x={13} y={10} width={22} height={4} rx={2} fill="#cbd5e1" />
    </Svg>
  );
}

export function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const [devCode, setDevCode] = useState("");

  async function requestCode() {
    const p = normalizePhone(phone);
    if (!p) return setError("شماره موبایل معتبر نیست.");
    setBusy(true); setError("");
    try {
      const r = await api<{ devCode?: string }>("/auth/otp/request", { method: "POST", body: { phone: p, purpose: "LOGIN" }, auth: false });
      setDevCode(r.devCode ?? "");
      setStep("code");
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError("");
    try {
      const r = await api<{ accessToken: string; refreshToken: string }>("/auth/otp/verify", {
        method: "POST", auth: false, body: { phone: normalizePhone(phone), code: toLatin(code).trim(), deviceName: `SmartGym ${Platform.OS}` },
      });
      await saveTokens(r.accessToken, r.refreshToken);
      onSignedIn();
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }

  const isPhone = step === "phone";
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <ImageBackground source={require("../../assets/login-hero.jpg")} resizeMode="cover" style={s.hero} imageStyle={{ opacity: 0.95 }}>
          <View style={s.shade} />
          <View style={s.brand}>
            <Mark />
            <Text style={s.logoTx}>Smart<Text style={{ color: G.green }}>Gym</Text></Text>
            <Text style={s.welcome}>به <Text style={{ color: G.green }}>اسمارت جیم</Text> خوش آمدید!</Text>
            <Text style={s.sub}>{isPhone ? "برای ورود، شماره موبایل خود را وارد کنید" : "کد تأیید پیامک‌شده را وارد کنید"}</Text>
          </View>
          {/* green swoosh + white curve at the bottom of the photo */}
          <Svg width="100%" height={110} viewBox="0 0 400 110" preserveAspectRatio="none" style={s.wave}>
            <Path d="M0 110V70C120 105 260 95 400 20v90z" fill={G.green} />
            <Path d="M0 110V86C130 112 270 104 400 36v74z" fill="#f8fafc" />
          </Svg>
        </ImageBackground>

        <View style={s.card}>
          {isPhone ? (
            <>
              <View style={s.labelRow}>
                <View style={s.badge}><MobileIcon /></View>
                <Text style={s.label}>شماره موبایل</Text>
              </View>
              <View style={s.inputWrap}>
                <TextInput
                  accessibilityLabel="شماره موبایل" value={phone} onChangeText={(t) => { setPhone(t); setError(""); }}
                  keyboardType="phone-pad" placeholder="۰۹۱۲۱۲۳۴۵۶۷" placeholderTextColor={G.ink3} autoComplete="tel"
                  onSubmitEditing={requestCode} style={s.input} maxLength={14}
                />
                <PhoneIcon />
              </View>
            </>
          ) : (
            <>
              <View style={s.labelRow}>
                <View style={s.badge}><MobileIcon /></View>
                <Text style={s.label}>کد تأیید ارسال‌شده به {phone}</Text>
              </View>
              <View style={s.inputWrap}>
                <TextInput
                  accessibilityLabel="کد تأیید" value={code} onChangeText={(t) => { setCode(t); setError(""); }} keyboardType="number-pad"
                  maxLength={8} autoComplete="sms-otp" textContentType="oneTimeCode" onSubmitEditing={verify} autoFocus
                  placeholder="- - - - - -" placeholderTextColor={G.ink3} style={[s.input, { textAlign: "center", letterSpacing: 8 }]}
                />
              </View>
            </>
          )}

          {!isPhone && devCode ? (
            <Pressable accessibilityRole="button" onPress={() => setCode(devCode)} style={s.devBox}>
              <Text style={s.devTx}>حالت تست: پیامک واقعی ارسال نمی‌شود</Text>
              <Text style={s.devCode}>{devCode}</Text>
              <Text style={s.devTx}>برای پر کردن کد، اینجا را بزنید</Text>
            </Pressable>
          ) : null}

          {error ? (
            <View style={s.errRow} accessibilityRole="alert">
              <View style={s.errDot}><Text style={s.errDotTx}>!</Text></View>
              <Text style={s.errTx}>{error}</Text>
            </View>
          ) : null}

          <Pressable accessibilityRole="button" accessibilityLabel={isPhone ? "دریافت کد تایید" : "ورود"} disabled={busy}
            onPress={isPhone ? requestCode : verify} style={({ pressed }) => [s.btn, (pressed || busy) && { opacity: 0.85 }]}>
            <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 10 10">
              <Defs><LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#22c55e" /><Stop offset="1" stopColor="#15803d" /></LinearGradient></Defs>
              <Rect width="10" height="10" fill="url(#bg)" />
            </Svg>
            {busy ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                <Text style={s.btnTx}>{isPhone ? "دریافت کد تایید" : "ورود"}</Text>
                <Text style={[s.btnTx, { fontSize: 22 }]}>←</Text>
              </View>
            )}
          </Pressable>

          {!isPhone && (
            <Pressable accessibilityRole="button" onPress={() => { setStep("phone"); setCode(""); setError(""); }} style={{ alignSelf: "center", padding: 6 }}>
              <Text style={{ color: G.green2, fontWeight: "700" }}>تغییر شماره</Text>
            </Pressable>
          )}

          <Pressable accessibilityRole="button" onPress={() => setHelp((h) => !h)} style={s.helpRow}>
            <View style={s.hr} />
            <Text style={s.help}>مشکل در ورود دارید؟</Text>
            <View style={s.hr} />
          </Pressable>
          {help && <Text style={[s.help, { textAlign: "right", lineHeight: 22 }]}>با همان شماره‌ای وارد شوید که در باشگاه ثبت کرده‌اید. اگر کد نرسید، چند دقیقه بعد دوباره تلاش کنید یا از پذیرش باشگاه بخواهید شماره‌ی شما را بررسی کند.</Text>}
        </View>

        <View style={s.footer}>
          <View style={s.footLine} />
          <Dumbbell />
          <View style={s.footLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: { height: HERO_H, backgroundColor: G.dark, justifyContent: "center" },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(6,14,11,0.55)" },
  brand: { alignItems: "flex-end", paddingHorizontal: 24, paddingBottom: 60, gap: 6 },
  logoTx: { color: "#fff", fontSize: 34, fontWeight: "900", letterSpacing: -0.5, writingDirection: "ltr" },
  welcome: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 14, textAlign: "right" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "right" },
  wave: { position: "absolute", bottom: -1, left: 0, right: 0 },
  card: {
    marginTop: -46, marginHorizontal: 18, backgroundColor: "#fff", borderRadius: 26, padding: 22, gap: 14,
    shadowColor: "#0f172a", shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 4,
  },
  labelRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  badge: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" },
  label: { color: G.ink, fontSize: 16, fontWeight: "800", textAlign: "right" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: G.line, borderRadius: 16, paddingHorizontal: 16, height: 58, backgroundColor: "#fff", gap: 10 },
  input: { flex: 1, minWidth: 0, width: "100%", fontSize: 20, color: G.ink, textAlign: "right", writingDirection: "ltr", height: "100%" },
  devBox: { borderWidth: 1, borderStyle: "dashed", borderColor: "#f59e0b", backgroundColor: "#fffbeb", borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  devTx: { color: "#92400e", fontSize: 13, textAlign: "center" },
  devCode: { color: "#92400e", fontSize: 26, fontWeight: "900", letterSpacing: 6, writingDirection: "ltr" },
  errRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  errDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: G.err, alignItems: "center", justifyContent: "center" },
  errDotTx: { color: "#fff", fontWeight: "900", fontSize: 13 },
  errTx: { color: G.err, fontSize: 14, fontWeight: "600", textAlign: "right", flexShrink: 1 },
  btn: {
    height: 58, borderRadius: 18, overflow: "hidden", alignItems: "center", justifyContent: "center", marginTop: 6,
    shadowColor: "#16a34a", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  btnTx: { color: "#fff", fontSize: 18, fontWeight: "800" },
  helpRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  hr: { flex: 1, height: 1, backgroundColor: G.line },
  help: { color: G.ink2, fontSize: 14 },
  footer: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 36, paddingVertical: 28, marginTop: "auto" },
  footLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
});
