import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { api, errorText, saveTokens } from "../api";
import { normalizePhone, toLatin } from "../format";
import { Btn, Card, ErrorText, Field, H, T } from "../ui";

export function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    const p = normalizePhone(phone);
    if (!p) return setError("شماره موبایل معتبر نیست.");
    setBusy(true); setError("");
    try {
      await api("/auth/otp/request", { method: "POST", body: { phone: p, purpose: "LOGIN" }, auth: false });
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <View style={{ gap: 6, marginBottom: 20 }}>
        <H size={26}>اسمارت‌جیم</H>
        <T muted>ورود ورزشکاران با شماره موبایل ثبت‌شده در باشگاه</T>
      </View>
      <Card>
        {step === "phone" ? (
          <>
            <Field label="شماره موبایل" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="۰۹۱۲۱۲۳۴۵۶۷" autoComplete="tel" onSubmitEditing={requestCode} />
            <ErrorText>{error}</ErrorText>
            <Btn title="دریافت کد تأیید" onPress={requestCode} busy={busy} />
          </>
        ) : (
          <>
            <T muted>کد پیامک‌شده به {phone} را وارد کنید.</T>
            <Field label="کد تأیید" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} autoComplete="sms-otp" textContentType="oneTimeCode" onSubmitEditing={verify} />
            <ErrorText>{error}</ErrorText>
            <Btn title="ورود" onPress={verify} busy={busy} />
            <Btn title="تغییر شماره" kind="ghost" onPress={() => { setStep("phone"); setCode(""); setError(""); }} />
          </>
        )}
      </Card>
    </KeyboardAvoidingView>
  );
}
