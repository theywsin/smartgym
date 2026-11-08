import { describe, expect, it, vi } from "vitest";
import { createSmsProviderFromEnv, MelipayamakSmsProvider, MelipayamakOtpSmsProvider } from "../src/sms";

function fakeFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

describe("MelipayamakSmsProvider", () => {
  it("sends the code as the template argument to a local-format number", async () => {
    const f = fakeFetch(200, { recId: 5432109876543, status: "ارسال موفق بود" });
    const p = new MelipayamakSmsProvider("KEY/with+chars", 123456, f as unknown as typeof fetch);
    const r = await p.sendOtp("+989121234567", "48213");
    expect(r.providerRef).toBe("5432109876543");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://console.melipayamak.com/api/send/shared/KEY%2Fwith%2Bchars");
    expect(JSON.parse(String(init.body))).toEqual({ bodyId: 123456, to: "09121234567", args: ["48213"] });
  });

  it("treats small recId values as provider errors and hides the key", async () => {
    const f = fakeFetch(200, { recId: 11, status: "متن ارسالی با الگو مطابقت ندارد" });
    const p = new MelipayamakSmsProvider("SECRET", 1, f as unknown as typeof fetch);
    const err = await p.sendOtp("+989121234567", "11111").catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("recId 11");
    expect((err as Error).message).not.toContain("SECRET");
    expect((err as Error).message).not.toContain("11111");
  });

  it("fails on HTTP errors", async () => {
    const p = new MelipayamakSmsProvider("K", 1, fakeFetch(401, {}) as unknown as typeof fetch);
    await expect(p.sendOtp("+989121234567", "1")).rejects.toThrow("HTTP 401");
  });

  it("is selected from env and validates config", () => {
    expect(createSmsProviderFromEnv({ SMS_PROVIDER: "melipayamak", MELIPAYAMAK_API_KEY: "k", MELIPAYAMAK_OTP_BODY_ID: "77" } as NodeJS.ProcessEnv).name).toBe("melipayamak");
    expect(() => createSmsProviderFromEnv({ SMS_PROVIDER: "melipayamak", MELIPAYAMAK_API_KEY: "k", MELIPAYAMAK_OTP_BODY_ID: "abc" } as NodeJS.ProcessEnv)).toThrow();
  });
});

describe("MelipayamakOtpSmsProvider", () => {
  it("posts {to} to send/otp and returns the generated code", async () => {
    const calls: [string, RequestInit][] = [];
    const f = (async (url: string, init: RequestInit) => { calls.push([url, init]); return new Response(JSON.stringify({ code: "48213", status: "ارسال موفق بود" }), { status: 200 }); }) as unknown as typeof fetch;
    const p = new MelipayamakOtpSmsProvider("KEY123", f);
    expect(await p.createOtp("+989121234567")).toEqual({ code: "48213" });
    expect(calls[0]![0]).toBe("https://console.melipayamak.com/api/send/otp/KEY123");
    expect(JSON.parse(String(calls[0]![1].body))).toEqual({ to: "09121234567" });
  });
  it("fails without leaking the key when no code comes back", async () => {
    const f = (async () => new Response(JSON.stringify({ code: null, status: "کلید نامعتبر" }), { status: 200 })) as unknown as typeof fetch;
    await expect(new MelipayamakOtpSmsProvider("SECRETKEY", f).createOtp("+989121234567")).rejects.toThrow(/^(?!.*SECRETKEY).*Melipayamak OTP failed/);
  });
});
