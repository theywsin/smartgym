const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/** Converts Persian and Arabic-Indic digits to ASCII digits. */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN.indexOf(ch);
    return String(p >= 0 ? p : ARABIC.indexOf(ch));
  });
}

/** Converts ASCII digits to Persian digits for display. */
export function toPersianDigits(input: string | number | bigint): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN[Number(d)]!);
}

/** Arabic yeh/kaf (common from Windows-1256 files and Arabic keyboards) -> Persian ی/ک. */
export function normalizePersianText(input: string): string {
  return input.replace(/[يى]/g, "ی").replace(/ك/g, "ک");
}
