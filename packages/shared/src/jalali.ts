/**
 * Jalali (Solar Hijri) <-> Gregorian conversion, after the jalaali-js algorithm (MIT).
 * Dates are calendar days (no time zone); callers decide which zone a day belongs to.
 */
import { toLatinDigits, toPersianDigits } from "./digits";

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

function jalCal(jy: number) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0]!;
  let jump = 0;
  if (jy < jp || jy >= BREAKS[BREAKS.length - 1]!) throw new RangeError(`Invalid Jalali year ${jy}`);
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i]!;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  const d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export interface YMD {
  y: number;
  m: number;
  d: number;
}

export function isValidJalali(jy: number, jm: number, jd: number): boolean {
  if (jy < -61 || jy >= 3177 || jm < 1 || jm > 12 || jd < 1) return false;
  return jd <= jalaliMonthLength(jy, jm);
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 0 ? 30 : 29;
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): YMD {
  const r = jalCal(jy);
  const jdn = g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  const g = d2g(jdn);
  return { y: g.gy, m: g.gm, d: g.gd };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): YMD {
  const jdn = g2d(gy, gm, gd);
  const g = d2g(jdn).gy;
  let jy = g - 621;
  const r = jalCal(jy);
  let k = jdn - g2d(g, 3, r.march);
  if (k >= 0) {
    if (k <= 185) return { y: jy, m: 1 + div(k, 31), d: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { y: jy, m: 7 + div(k, 30), d: mod(k, 30) + 1 };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "1370/05/12" or "۱۳۷۰/۵/۱۲" -> "1991-08-03" (ISO calendar date), or null if invalid. */
export function parseJalaliDate(input: string): string | null {
  const m = toLatinDigits(input).trim().match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (!m) return null;
  const [jy, jm, jd] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!isValidJalali(jy, jm, jd)) return null;
  const g = jalaliToGregorian(jy, jm, jd);
  return `${g.y}-${pad(g.m)}-${pad(g.d)}`;
}

/** "1991-08-03" -> "1370/05/12" (Latin digits). */
export function isoDateToJalali(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  const j = gregorianToJalali(y, m, d);
  return `${j.y}/${pad(j.m)}/${pad(j.d)}`;
}

/** The Tehran calendar day of an instant, as Jalali with Persian digits: "۱۴۰۵/۰۸/۱۶". */
export function formatJalali(date: Date | string): string {
  const t = new Date(date).getTime() + 3.5 * 3600_000; // Iran: fixed UTC+03:30 since 2022
  const g = new Date(t);
  const j = gregorianToJalali(g.getUTCFullYear(), g.getUTCMonth() + 1, g.getUTCDate());
  return toPersianDigits(`${j.y}/${pad(j.m)}/${pad(j.d)}`);
}

/** Tehran wall-clock time "۱۸:۰۵". */
export function formatTehranTime(date: Date | string): string {
  const t = new Date(new Date(date).getTime() + 3.5 * 3600_000);
  return toPersianDigits(`${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`);
}
