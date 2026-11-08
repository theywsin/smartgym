/**
 * SMS provider abstraction. Credentials come from server env only.
 *   SMS_PROVIDER=console    (default outside production) logs codes, never sends
 *   SMS_PROVIDER=melipayamak needs MELIPAYAMAK_API_KEY and MELIPAYAMAK_OTP_BODY_ID (approved shared-line template)
 *   SMS_PROVIDER=melipayamak_otp needs only MELIPAYAMAK_API_KEY (Melipayamak makes and sends the code)
 *   SMS_PROVIDER=kavenegar  needs KAVENEGAR_API_KEY and KAVENEGAR_OTP_TEMPLATE
 * Optional notification templates: MELIPAYAMAK_EXPIRY_BODY_ID / KAVENEGAR_EXPIRY_TEMPLATE.
 */
/** Notification templates (each must be approved with the SMS provider; args fill {0}, {1}, ...). */
export type SmsTemplate = "MEMBERSHIP_EXPIRY"; // {0} first name, {1} gym name, {2} days left

export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneE164: string, code: string): Promise<{ providerRef?: string }>;
  /**
   * Providers whose service generates the code itself (Melipayamak "send/otp"): sends the SMS and
   * returns the code that was sent, so it can be hashed and checked. When present it is used instead of sendOtp.
   */
  createOtp?(phoneE164: string): Promise<{ code: string; providerRef?: string }>;
  /** True only for the console (test) provider: the code may then be shown on screen. */
  isTest?(): Promise<boolean>;
  /** Throws SmsTemplateNotConfigured when the template has no approved id configured. */
  sendTemplate(phoneE164: string, template: SmsTemplate, args: string[]): Promise<{ providerRef?: string }>;
  supports(template: SmsTemplate): boolean;
}

export class SmsTemplateNotConfigured extends Error {
  constructor(template: SmsTemplate) {
    super(`SMS template ${template} is not configured`);
  }
}

/** Development/test provider: keeps the last code per phone in memory. */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";
  readonly sent = new Map<string, string>();
  async isTest() { return true; }

  async sendOtp(phoneE164: string, code: string) {
    this.sent.set(phoneE164, code);
    if (process.env.NODE_ENV !== "test") {
      console.info(`[sms:console] OTP for ${phoneE164}: ${code}`);
    }
    return { providerRef: `console-${Date.now()}` };
  }

  readonly templates: { to: string; template: SmsTemplate; args: string[] }[] = [];
  supports(): boolean {
    return true;
  }

  async sendTemplate(phoneE164: string, template: SmsTemplate, args: string[]) {
    this.templates.push({ to: phoneE164, template, args });
    if (process.env.NODE_ENV !== "test") console.info(`[sms:console] ${template} to ${phoneE164}: ${JSON.stringify(args)}`);
    return { providerRef: `console-${Date.now()}` };
  }
}

/** Kavenegar "verify/lookup" template API (https://kavenegar.com/rest.html#sms-Lookup). */
export class KavenegarSmsProvider implements SmsProvider {
  readonly name = "kavenegar";
  constructor(
    private readonly apiKey: string,
    private readonly template: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly templates: Partial<Record<SmsTemplate, string>> = {}
  ) {
    if (!apiKey || !template) throw new Error("Kavenegar needs KAVENEGAR_API_KEY and KAVENEGAR_OTP_TEMPLATE");
  }

  async sendOtp(phoneE164: string, code: string) {
    return this.lookup(phoneE164, this.template, [code]);
  }

  supports(template: SmsTemplate): boolean {
    return !!this.templates[template];
  }

  async sendTemplate(phoneE164: string, template: SmsTemplate, args: string[]) {
    const name = this.templates[template];
    if (!name) throw new SmsTemplateNotConfigured(template);
    // Kavenegar tokens cannot contain spaces.
    return this.lookup(phoneE164, name, args.map((a) => a.replace(/\s+/g, "\u200c")));
  }

  private async lookup(phoneE164: string, template: string, tokens: string[]) {
    const receptor = `0${phoneE164.replace(/^\+98/, "")}`;
    const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/verify/lookup.json`);
    url.searchParams.set("receptor", receptor);
    tokens.slice(0, 3).forEach((t, i) => url.searchParams.set(i === 0 ? "token" : `token${i + 1}`, t));
    url.searchParams.set("template", template);
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
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly templates: Partial<Record<SmsTemplate, number>> = {}
  ) {
    if (!apiKey || !Number.isInteger(bodyId) || bodyId <= 0) {
      throw new Error("Melipayamak needs MELIPAYAMAK_API_KEY and a numeric MELIPAYAMAK_OTP_BODY_ID");
    }
  }

  async sendOtp(phoneE164: string, code: string) {
    return this.send(this.bodyId, phoneE164, [code]);
  }

  supports(template: SmsTemplate): boolean {
    return !!this.templates[template];
  }

  async sendTemplate(phoneE164: string, template: SmsTemplate, args: string[]) {
    const bodyId = this.templates[template];
    if (!bodyId) throw new SmsTemplateNotConfigured(template);
    return this.send(bodyId, phoneE164, args);
  }

  private async send(bodyId: number, phoneE164: string, args: string[]) {
    const to = `0${phoneE164.replace(/^\+98/, "")}`;
    const url = `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(this.apiKey)}`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bodyId, to, args }),
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

/**
 * Melipayamak OTP service: no template needed. Melipayamak writes and sends the message and
 * returns the generated code.  POST https://console.melipayamak.com/api/send/otp/{apiKey}  {to}  ->  {code, status}
 */
export class MelipayamakOtpSmsProvider implements SmsProvider {
  readonly name = "melipayamak-otp";
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
    /** Optional shared-line provider for notification templates (expiry reminders). */
    private readonly templates: SmsProvider | null = null
  ) {
    if (!apiKey) throw new Error("Melipayamak OTP needs an API key");
  }

  async createOtp(phoneE164: string) {
    const to = `0${phoneE164.replace(/^\+98/, "")}`;
    const res = await this.fetchImpl(`https://console.melipayamak.com/api/send/otp/${encodeURIComponent(this.apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => null)) as { code?: string | number; status?: string } | null;
    const code = String(body?.code ?? "").trim();
    if (!res.ok || !/^\d{4,8}$/.test(code)) {
      // Never include the API key or the code in the error.
      throw new Error(`Melipayamak OTP failed (HTTP ${res.status}, ${body?.status ?? "no status"})`);
    }
    return { code };
  }
  async sendOtp(): Promise<{ providerRef?: string }> {
    throw new Error("MelipayamakOtpSmsProvider generates its own codes; use createOtp");
  }
  supports(t: SmsTemplate) { return !!this.templates?.supports(t); }
  async sendTemplate(phoneE164: string, t: SmsTemplate, args: string[]) {
    if (!this.templates) throw new SmsTemplateNotConfigured(t);
    return this.templates.sendTemplate(phoneE164, t, args);
  }
}

export function createSmsProviderFromEnv(env: NodeJS.ProcessEnv = process.env): SmsProvider {
  const kind = env.SMS_PROVIDER ?? (env.NODE_ENV === "production" ? "" : "console");
  switch (kind) {
    case "melipayamak_otp":
      return new MelipayamakOtpSmsProvider(env.MELIPAYAMAK_API_KEY ?? "", fetch,
        Number(env.MELIPAYAMAK_EXPIRY_BODY_ID) > 0 ? new MelipayamakSmsProvider(env.MELIPAYAMAK_API_KEY ?? "", Number(env.MELIPAYAMAK_EXPIRY_BODY_ID), fetch, { MEMBERSHIP_EXPIRY: Number(env.MELIPAYAMAK_EXPIRY_BODY_ID) }) : null);
    case "console":
      if (env.NODE_ENV === "production" && env.ALLOW_CONSOLE_SMS !== "true") {
        throw new Error("SMS_PROVIDER=console is not allowed in production");
      }
      return new ConsoleSmsProvider();
    case "melipayamak":
      return new MelipayamakSmsProvider(env.MELIPAYAMAK_API_KEY ?? "", Number(env.MELIPAYAMAK_OTP_BODY_ID ?? ""), fetch, {
        ...(Number(env.MELIPAYAMAK_EXPIRY_BODY_ID) > 0 && { MEMBERSHIP_EXPIRY: Number(env.MELIPAYAMAK_EXPIRY_BODY_ID) }),
      });
    case "kavenegar":
      return new KavenegarSmsProvider(env.KAVENEGAR_API_KEY ?? "", env.KAVENEGAR_OTP_TEMPLATE ?? "", fetch, {
        ...(env.KAVENEGAR_EXPIRY_TEMPLATE && { MEMBERSHIP_EXPIRY: env.KAVENEGAR_EXPIRY_TEMPLATE }),
      });
    default:
      throw new Error(`Unknown or missing SMS_PROVIDER: "${kind}"`);
  }
}
