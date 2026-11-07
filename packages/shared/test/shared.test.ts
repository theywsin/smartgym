import { describe, it, expect } from "vitest";
import {
  normalizeIranMobile,
  formatIranMobile,
  tomanToRial,
  rialToToman,
  formatToman,
  applyBasisPoints,
  toLatinDigits,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
} from "../src";

describe("normalizeIranMobile", () => {
  it.each([
    ["09121234567", "+989121234567"],
    ["9121234567", "+989121234567"],
    ["+989121234567", "+989121234567"],
    ["00989121234567", "+989121234567"],
    ["989121234567", "+989121234567"],
    ["0912 123 4567", "+989121234567"],
    ["۰۹۱۲۱۲۳۴۵۶۷", "+989121234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeIranMobile(input)).toBe(expected);
  });

  it.each(["", "021123456", "0812123456", "091212345678", "abc", "+449121234567"])("rejects %s", (input) => {
    expect(normalizeIranMobile(input)).toBeNull();
  });

  it("formats for display", () => {
    expect(formatIranMobile("+989121234567")).toBe("0912 123 4567");
  });
});

describe("money", () => {
  it("converts toman and rial without floats", () => {
    expect(tomanToRial(1_250_000)).toBe(12_500_000n);
    expect(rialToToman(12_500_009n)).toBe(1_250_000n);
    expect(() => tomanToRial(1.5)).toThrow();
  });

  it("formats toman with Persian digits", () => {
    expect(formatToman(12_500_000n)).toBe("۱٬۲۵۰٬۰۰۰ تومان");
    expect(formatToman(12_500_000n, { persianDigits: false, suffix: false })).toBe("1,250,000");
  });

  it("applies basis points with half-up rounding", () => {
    expect(applyBasisPoints(1_000_000n, 1500)).toBe(150_000n);
    expect(applyBasisPoints(15n, 5000)).toBe(8n);
  });
});

describe("digits", () => {
  it("handles Persian and Arabic digits", () => {
    expect(toLatinDigits("۱۲۳٤٥٦")).toBe("123456");
  });
});

describe("permissions", () => {
  it("only maps roles to known permissions", () => {
    const known = new Set<string>(PERMISSIONS);
    for (const perms of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
      for (const p of perms) expect(known.has(p)).toBe(true);
    }
  });

  it("gives owners everything and athletes no staff permissions", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.GYM_OWNER).toHaveLength(PERMISSIONS.length);
    expect(DEFAULT_ROLE_PERMISSIONS.ATHLETE).toHaveLength(0);
  });
});
