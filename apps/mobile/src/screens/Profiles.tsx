import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { api, errorText } from "../api";
import { fa } from "../format";
import { Btn, C, Card, ErrorText, H, Loading, T } from "../ui";

export type Membership = { state: string; planName: string | null; daysLeft: number | null; entriesLeft: number | null; endsAt: string | null };
type Profile = { memberId: string; gymName: string; firstName: string; lastName: string; code: number; membership: Membership };

export const STATE_LABEL: Record<string, string> = { active: "فعال", exhausted: "جلسات تمام شده", suspended: "تعلیق", upcoming: "شروع نشده", expired: "منقضی", none: "بدون اشتراک" };

export function Profiles({ onOpen, onLogout }: { onOpen: (id: string) => void; onLogout: () => void }) {
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Profile[]>("/athlete/profiles").then(setRows).catch((e) => setError(errorText(e)));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <H size={22}>باشگاه‌های من</H>
      <ErrorText>{error}</ErrorText>
      {!rows && !error && <Loading />}
      {rows?.length === 0 && (
        <Card><T>با این شماره در هیچ باشگاهی عضو نیستید. از پذیرش باشگاه بخواهید شماره موبایل شما را در پرونده‌تان ثبت کند.</T></Card>
      )}
      {rows?.map((p) => (
        <Pressable key={p.memberId} accessibilityRole="button" onPress={() => onOpen(p.memberId)}>
          <Card>
            <H>{p.gymName}</H>
            <T muted>{p.firstName} {p.lastName} · کد {fa(p.code)}</T>
            <View style={{ flexDirection: "row-reverse" }}>
              <T style={{ color: p.membership.state === "active" ? C.brand : C.warn, fontWeight: "700" }}>{STATE_LABEL[p.membership.state] ?? p.membership.state}</T>
            </View>
          </Card>
        </Pressable>
      ))}
      <Btn title="خروج از حساب" kind="ghost" onPress={onLogout} />
    </ScrollView>
  );
}
