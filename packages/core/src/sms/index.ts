/**
 * SMS provider abstraction. Credentials come from server env only.
 *   SMS_PROVIDER=console    (default outside production) logs codes, never sends
 *   SMS_PROVIDER=melipayamak needs MELIPAYAMAK_API_KEY and MELIPAYAMAK_OTP_BODY_ID (approved shared-line template)
 *   SMS_PROVIDER=kavenegar  needs KAVENEGAR_API_KEY and KAVENEGAR_OTP_TEMPLATE
 */
export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneE164: string, code: string): Promise<{ providerRef?: string }>;
}

/** Development/test provider: keeps the last code per phone in memory. */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  readonly sent = new Map<string, string>();

  async sendOtp(phoneE164: string, code: string) {
    this.sent.set(phoneE164, code);
    if (process.env.NODE_ENV !== "test") {
      console.info(`[sms:console] OTP for ${phoneE164}: ${code}`);
    }
    return { providerRef: `console-${Date.now()}` };
  }
}

/** Kavenegar "verify/lookup" template API (https://kavenegar.com/rest.html#sms-Lookup). */
export class KavenegarSmsProvider implements SmsProvider {
  readonly name = "kavenegar";
  constructor(
    private readonly apiKey: string,
    private readonly template: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {
    if (!apiKey || !template) throw new Error("Kavenegar needs KAVENEGAR_API_KEY and KAVENEGAR_OTP_TEMPLATE");
  }

  async sendOtp(phoneE164: string, code: string) {
    const receptor = `0${phoneE164.replace(/^\+98/, "")}`;
    const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/verify/lookup.json`);
    url.searchParams.set("receptor", receptor);
    url.searchParams.set("token", code);
    url.searchParams.set("template", this.template);
    const res = await this.fetchImpl(url, { method: "POST", signal: AbortSignal.timeout(10_000) });
    const body = (await res.json().catch(() => null)) as { return?: { status?: number }; entries?: { messageid?: number }[] } | null;
    if (!res.ok || body?.return?.status !== 200) {
      throw new Error(`Kavenegar send failed (HTTP ${res.status}, status ${body?.return?.status ?? "?"})`);
    }
    return { providerRef: String(body.entries?.[0]?.messageid ?? "") };
  }
}

/**
 * Melipayamak shared service line ("خط خدماتی اشتراکی"): sends an approved template (bodyId)
 * with the code as its only argument. API key from the Melipayamak console (توسعه‌دهندگان).
 * POST https://console.melipayamak.com/api/send/shared/{apiKey}  {bodyId, to, args}
 * A successful send returns a large recId; small numbers are Melipayamak error codes.
 */
export class MelipayamakSmsProvider implements SmsProvider {
  readonly name = "melipayamak";
  constructor(
    private readonly apiKey: string,
    private readonly bodyId: number,
    private readonly fetchImpl: typeof fetch = fetch
  ) {
    if (!apiKey || !Number.isInteger(bodyId) || bodyId <= 0) {
      throw new Error("Melipayamak needs MELIPAYAMAK_API_KEY and a numeric MELIPAYAMAK_OTP_BODY_ID");
    }
  }

  async sendOtp(phoneE164: string, code: string) {
    const to = `0${phoneE164.replace(/^\+98/, "")}`;
    const url = `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(this.apiKey)}`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bodyId: this.bodyId, to, args: [code] }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => null)) as { recId?: number | string; status?: string } | null;
    const recId = Number(body?.recId ?? 0);
    if (!res.ok || !Number.isFinite(recId) || recId < 1000) {
      // Never include the API key or the code in the error.
      throw new Error(`Melipayamak send failed (HTTP ${res.status}, recId ${body?.recId ?? "?"}, ${body?.status ?? "no status"})`);
    }
    return { providerRef: String(body?.recId) };
  }
}

export function createSmsProviderFromEnv(env: NodeJS.ProcessEnv = process.env): SmsProvider {
  const kind = env.SMS_PROVIDER ?? (env.NODE_ENV === "production" ? "" : "console");
  switch (kind) {
    case "console":
      if (env.NODE_ENV === "production" && env.ALLOW_CONSOLE_SMS !== "true") {
        throw new Error("SMS_PROVIDER=console is not allowed in production");
      }
      return new ConsoleSmsProvider();
    case "melipayamak":
      return new MelipayamakSmsProvider(env.MELIPAYAMAK_API_KEY ?? "", Number(env.MELIPAYAMAK_OTP_BODY_ID ?? ""));
    case "kavenegar":
      return new KavenegarSmsProvider(env.KAVENEGAR_API_KEY ?? "", env.KAVENEGAR_OTP_TEMPLATE ?? "");
    default:
      throw new Error(`Unknown or missing SMS_PROVIDER: "${kind}"`);
  }
}
