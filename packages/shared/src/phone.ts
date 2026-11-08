import { toLatinDigits } from "./digits";

/**
 * Normalises an Iranian mobile number to E.164 (+989XXXXXXXXX).
 * Accepts 09…, 9…, +989…, 00989…, 989…, with spaces/dashes and Persian digits.
 * Returns null when the input is not an Iranian mobile number.
 */
export function normalizeIranMobile(input: string): string | null {
  if (typeof input !== "string") return null;
  let digits = toLatinDigits(input).replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^9\d{9}$/.test(digits)) return null;
  return `+98${digits}`;
}

/** Formats +989121234567 as 0912 123 4567 for display. */
export function formatIranMobile(e164: string): string {
  const local = `0${e164.replace(/^\+98/, "")}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
