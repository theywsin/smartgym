import { formatJalali, formatToman, toPersianDigits, tomanToRial } from "@smartgym/shared";

/** API money arrives as a rial decimal string (bigint over JSON). */
export function toman(rial: string | number | bigint | null | undefined): string {
  if (rial === null || rial === undefined) return "—";
  return formatToman(BigInt(rial));
}

/** Toman typed by staff (Persian digits and separators allowed) -> rial string for the API. */
export function tomanInputToRial(v: string): string | null {
  const latin = v.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[,٬،\s]/g, "");
  if (!/^\d{1,15}$/.test(latin)) return null;
  return tomanToRial(BigInt(latin)).toString();
}

export const jdate = (d: string | Date | null | undefined) => (d ? formatJalali(d) : "—");
export const fa = (n: number | string) => toPersianDigits(n);
export const fullName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`;
