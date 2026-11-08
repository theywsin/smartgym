import type { ComponentProps } from "react";
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextProps, type TextStyle } from "react-native";

/** Peyda font files, one family per weight (Android/iOS do not synthesize weights for custom fonts). */
export const FONT_FILES = {
  "Peyda-Regular": require("../assets/fonts/Peyda-Regular.ttf"),
  "Peyda-Medium": require("../assets/fonts/Peyda-Medium.ttf"),
  "Peyda-Bold": require("../assets/fonts/Peyda-Bold.ttf"),
  "Peyda-Black": require("../assets/fonts/Peyda-Black.ttf"),
};

function family(weight: TextStyle["fontWeight"]) {
  const w = typeof weight === "number" ? weight : weight === "bold" ? 700 : Number(weight ?? 400) || 400;
  return w >= 800 ? "Peyda-Black" : w >= 650 ? "Peyda-Bold" : w >= 500 ? "Peyda-Medium" : "Peyda-Regular";
}
function withFont(style: TextProps["style"]) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: family(fontWeight) };
}

/** Text that always renders in Peyda, mapping fontWeight to the matching font file. (React 19: ref is a regular prop.) */
export function Text(props: ComponentProps<typeof RNText>) {
  return <RNText {...props} style={withFont(props.style)} />;
}
export function TextInput(props: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...props} style={withFont(props.style as TextProps["style"])} />;
}
