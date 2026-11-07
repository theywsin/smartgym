import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

export const C = { bg: "#f6f8f7", card: "#ffffff", ink: "#111827", ink2: "#4b5563", ink3: "#9ca3af", brand: "#16a34a", brandTx: "#ffffff", line: "#e5e7eb", err: "#b91c1c", warn: "#b45309", okBg: "#dcfce7" };

export function Screen({ children }: { children: ReactNode }) {
  return <View style={s.screen}>{children}</View>;
}
export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function H({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return <Text style={[s.h, { fontSize: size }]}>{children}</Text>;
}
export function T({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[s.t, muted && { color: C.ink2 }, style]}>{children}</Text>;
}
export function Btn({ title, onPress, busy, kind = "primary", disabled }: { title: string; onPress: () => void; busy?: boolean; kind?: "primary" | "ghost"; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} disabled={busy || disabled} style={({ pressed }) => [s.btn, kind === "ghost" && s.ghost, (pressed || busy || disabled) && { opacity: 0.6 }]}>
      {busy ? <ActivityIndicator color={kind === "ghost" ? C.brand : C.brandTx} /> : <Text style={[s.btnTx, kind === "ghost" && { color: C.brand }]}>{title}</Text>}
    </Pressable>
  );
}
export function Field({ label, ...p }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={C.ink3} style={[s.input, p.multiline && { minHeight: 100, textAlignVertical: "top" }]} {...p} />
    </View>
  );
}
export const ErrorText = ({ children }: { children: ReactNode }) => (children ? <Text accessibilityRole="alert" style={s.err}>{children}</Text> : null);
export const Loading = () => <View style={{ padding: 40 }}><ActivityIndicator color={C.brand} size="large" /></View>;
export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.t}>{k}</Text>
      <Text style={[s.t, { fontWeight: "700" }]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: C.line },
  h: { color: C.ink, fontWeight: "800", textAlign: "right" },
  t: { color: C.ink, fontSize: 14, textAlign: "right", lineHeight: 22 },
  label: { color: C.ink2, fontSize: 13, textAlign: "right" },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: "right", color: C.ink, backgroundColor: "#fff" },
  btn: { backgroundColor: C.brand, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.brand },
  btnTx: { color: C.brandTx, fontWeight: "700", fontSize: 15 },
  err: { color: C.err, textAlign: "right" },
  row: { flexDirection: "row-reverse", justifyContent: "space-between", gap: 8 },
});
