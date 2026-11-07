import { describe, expect, it } from "vitest";
import { formatJalali, gregorianToJalali, isoDateToJalali, jalaliToGregorian, parseJalaliDate, formatTehranTime } from "../src";

describe("jalali", () => {
  it("converts known dates", () => {
    expect(jalaliToGregorian(1405, 1, 1)).toEqual({ y: 2026, m: 3, d: 21 });
    expect(jalaliToGregorian(1403, 1, 1)).toEqual({ y: 2024, m: 3, d: 20 });
    expect(gregorianToJalali(1991, 8, 3)).toEqual({ y: 1370, m: 5, d: 12 });
    expect(gregorianToJalali(2026, 11, 7)).toEqual({ y: 1405, m: 8, d: 16 });
  });

  it("matches the platform's Persian calendar for every day of 20 years", () => {
    const fmt = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" });
    for (let t = Date.UTC(2010, 0, 1); t < Date.UTC(2030, 0, 1); t += 86_400_000) {
      const d = new Date(t);
      const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
      const j = gregorianToJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      expect([j.y, j.m, j.d]).toEqual([Number.parseInt(parts.year!), Number(parts.month), Number(parts.day)]);
      const back = jalaliToGregorian(j.y, j.m, j.d);
      expect([back.y, back.m, back.d]).toEqual([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]);
    }
  });

  it("parses user input with Persian digits and rejects impossible dates", () => {
    expect(parseJalaliDate("۱۳۷۰/۵/۱۲")).toBe("1991-08-03");
    expect(parseJalaliDate("1370-05-12")).toBe("1991-08-03");
    expect(parseJalaliDate("1403/12/30")).toBe("2025-03-20"); // 1403 is leap
    expect(parseJalaliDate("1404/12/30")).toBeNull();
    expect(parseJalaliDate("1370/13/01")).toBeNull();
    expect(parseJalaliDate("salam")).toBeNull();
    expect(isoDateToJalali("1991-08-03")).toBe("1370/05/12");
  });

  it("formats instants in Tehran time", () => {
    expect(formatJalali("2026-03-20T20:29:00Z")).toBe("۱۴۰۴/۱۲/۲۹");
    expect(formatJalali("2026-03-20T20:30:00Z")).toBe("۱۴۰۵/۰۱/۰۱");
    expect(formatTehranTime("2026-03-20T20:35:00Z")).toBe("۰۰:۰۵");
  });
});
