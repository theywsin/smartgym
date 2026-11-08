const FA = "۰۱۲۳۴۵۶۷۸۹";
export const fa = (v: string | number) => String(v).replace(/\d/g, (d) => FA[Number(d)]!);
export const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
/** Rial string (API sends bigint as string) to grouped toman. */
export function toman(rial: string | number) {
  const t = BigInt(String(rial)) / 10n;
  return `${fa(t.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))} تومان`;
}
export function jdate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", ...(withTime && { hour: "2-digit", minute: "2-digit" }), timeZone: "Asia/Tehran" }).format(new Date(iso));
}
/** 09121234567 / 9121234567 / +989121234567 to +98 form, or null. */
export function normalizePhone(input: string) {
  const d = toLatin(input).replace(/[\s-]/g, "");
  const m = d.match(/^(?:\+98|0098|98|0)?(9\d{9})$/);
  return m ? `+98${m[1]}` : null;
}
