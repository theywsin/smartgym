import { toPersianDigits } from "./digits";

/**
 * Money is stored as integer RIAL (bigint) everywhere (see docs/ARCHITECTURE.md ADR-4).
 * The UI shows toman (1 toman = 10 rial).
 */
export type Rial = bigint;

export function tomanToRial(toman: number | bigint): Rial {
  if (typeof toman === "number") {
    if (!Number.isSafeInteger(toman)) throw new RangeError("Toman amount must be a safe integer");
    return BigInt(toman) * 10n;
  }
  return toman * 10n;
}

/** Rial → toman, rounded down to whole toman. */
export function rialToToman(rial: Rial): bigint {
  return rial / 10n;
}

function groupThousands(value: bigint): string {
  const negative = value < 0n;
  const s = (negative ? -value : value).toString();
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return negative ? `-${grouped}` : grouped;
}

/** e.g. 12_500_000n rial → "۱٬۲۵۰٬۰۰۰ تومان" */
export function formatToman(rial: Rial, opts: { persianDigits?: boolean; suffix?: boolean } = {}): string {
  const { persianDigits = true, suffix = true } = opts;
  let text = groupThousands(rialToToman(rial));
  if (persianDigits) text = toPersianDigits(text).replace(/,/g, "٬");
  return suffix ? `${text} تومان` : text;
}

/** Applies a percentage in basis points (1% = 100 bp), rounding half up to the rial. */
export function applyBasisPoints(amount: Rial, basisPoints: number): Rial {
  if (!Number.isInteger(basisPoints)) throw new RangeError("basisPoints must be an integer");
  const product = amount * BigInt(basisPoints);
  return (product + 5000n) / 10000n;
}
