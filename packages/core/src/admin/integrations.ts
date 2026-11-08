import crypto from "node:crypto";
import { withSystem } from "@smartgym/db";
import type { IntegrationsInput } from "@smartgym/validation";
import { AppError } from "../errors";
import type { CoreDeps } from "../deps";
import type { AdminActor } from "./index";
import { adminAudit, requireSuperAdmin } from "./platform";
import { randomOtp } from "../auth/crypto";
import { MelipayamakOtpSmsProvider, MelipayamakSmsProvider, type SmsProvider, type SmsTemplate } from "../sms";

/**
 * Third-party service settings edited in the platform admin. Stored apart from the public settings
 * (never returned by /public/platform). The API key is encrypted at rest with a key derived from
 * JWT_SECRET, and the admin UI only ever sees a masked value.
 */
const KEY = "integrations";

type Stored = { sms: { provider: "env" | "melipayamak" | "melipayamak_otp"; apiKeyEnc?: string; otpBodyId: string; expiryBodyId: string }; payment: { onlineEnabled: boolean } };
const DEFAULTS: Stored = { sms: { provider: "env", otpBodyId: "", expiryBodyId: "" }, payment: { onlineEnabled: true } };

const aesKey = (secret: string) => crypto.createHash("sha256").update(`smartgym/integrations/v1:${secret}`).digest();
function encrypt(secret: string, plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", aesKey(secret), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}
function decrypt(secret: string, blob: string): string | null {
  try {
    const [iv, tag, enc] = blob.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = crypto.createDecipheriv("aes-256-gcm", aesKey(secret), iv!);
    d.setAuthTag(tag!);
    return Buffer.concat([d.update(enc!), d.final()]).toString("utf8");
  } catch {
    return null; // JWT_SECRET changed: the key must be entered again
  }
}

async function readStored(deps: CoreDeps): Promise<Stored> {
  const row = await withSystem(deps.db, (tx) => tx.platformSetting.findUnique({ where: { key: KEY } }));
  const v = (row?.value ?? {}) as Partial<Stored>;
  return { sms: { ...DEFAULTS.sms, ...v.sms }, payment: { ...DEFAULTS.payment, ...v.payment } };
}

const mask = (k: string | null) => (k ? `${"•".repeat(8)}${k.slice(-4)}` : "");

export async function adminGetIntegrations(deps: CoreDeps, actor: AdminActor) {
  await withSystem(deps.db, (tx) => requireSuperAdmin(tx, actor));
  const s = await readStored(deps);
  const key = s.sms.apiKeyEnc ? decrypt(deps.config.jwtSecret, s.sms.apiKeyEnc) : null;
  return {
    sms: { provider: s.sms.provider, apiKeyMasked: mask(key), apiKeySet: !!key, otpBodyId: s.sms.otpBodyId, expiryBodyId: s.sms.expiryBodyId, envProvider: process.env.SMS_PROVIDER ?? "" },
    payment: s.payment,
  };
}

export async function adminSetIntegrations(deps: CoreDeps, actor: AdminActor, input: IntegrationsInput) {
  const cur = await readStored(deps);
  const apiKeyEnc = input.sms.melipayamakApiKey ? encrypt(deps.config.jwtSecret, input.sms.melipayamakApiKey) : cur.sms.apiKeyEnc;
  if (input.sms.provider === "melipayamak" && (!apiKeyEnc || !input.sms.otpBodyId)) {
    throw new AppError("VALIDATION_FAILED", "برای ملی پیامک کلید API و کد الگوی ورود لازم است.", { fields: { otpBodyId: ["لازم است"] } });
  }
  if (input.sms.provider === "melipayamak_otp" && !apiKeyEnc) {
    throw new AppError("VALIDATION_FAILED", "برای سرویس OTP ملی پیامک کلید API لازم است.", { fields: { melipayamakApiKey: ["لازم است"] } });
  }
  const next: Stored = { sms: { provider: input.sms.provider, apiKeyEnc, otpBodyId: input.sms.otpBodyId, expiryBodyId: input.sms.expiryBodyId }, payment: input.payment };
  await withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    await tx.platformSetting.upsert({ where: { key: KEY }, update: { value: next, updatedBy: actor.userId }, create: { key: KEY, value: next, updatedBy: actor.userId } });
    // Never write the key itself to the audit log.
    await adminAudit(tx, actor, "platform.integrations", "platform_setting", KEY, null, { sms: { provider: next.sms.provider, keyChanged: !!input.sms.melipayamakApiKey, otpBodyId: next.sms.otpBodyId }, payment: next.payment });
  });
  cache = null;
  return adminGetIntegrations(deps, actor);
}

/** Whether members may pay online (platform switch). */
export async function onlinePaymentsEnabled(deps: CoreDeps): Promise<boolean> {
  return (await readStored(deps)).payment.onlineEnabled;
}

let cache: { at: number; provider: SmsProvider | null } | null = null;

/**
 * SMS provider that follows the admin settings: Melipayamak when configured there, otherwise the
 * provider from the server environment. Settings are re-read at most every 30 seconds.
 */
export class SettingsSmsProvider implements SmsProvider {
  readonly name = "settings";
  constructor(private readonly deps: () => CoreDeps, private readonly fallback: SmsProvider) {}

  private async current(): Promise<SmsProvider> {
    if (!cache || Date.now() - cache.at > 30_000) {
      let provider: SmsProvider | null = null;
      try {
        const s = await readStored(this.deps());
        const key = s.sms.apiKeyEnc ? decrypt(this.deps().config.jwtSecret, s.sms.apiKeyEnc) : null;
        const tpl = Number(s.sms.expiryBodyId) > 0 ? { MEMBERSHIP_EXPIRY: Number(s.sms.expiryBodyId) } : {};
        if (s.sms.provider === "melipayamak" && key && Number(s.sms.otpBodyId) > 0) {
          provider = new MelipayamakSmsProvider(key, Number(s.sms.otpBodyId), fetch, tpl);
        } else if (s.sms.provider === "melipayamak_otp" && key) {
          // Reminders still need an approved shared-line template; the OTP itself does not.
          const shared = Number(s.sms.expiryBodyId) > 0 ? new MelipayamakSmsProvider(key, Number(s.sms.expiryBodyId), fetch, tpl) : null;
          provider = new MelipayamakOtpSmsProvider(key, fetch, shared);
        }
      } catch { provider = null; }
      cache = { at: Date.now(), provider };
    }
    return cache.provider ?? this.fallback;
  }
  /** Loads the current settings now (call before checking supports()). */
  async refresh() { cache = null; await this.current(); }
  async sendOtp(phone: string, code: string) { return (await this.current()).sendOtp(phone, code); }
  async isTest() { const p = await this.current(); return !!(await p.isTest?.()); }
  /** Always present: uses the provider's own code when it makes one, otherwise generates and sends ours. */
  async createOtp(phone: string) {
    const p = await this.current();
    if (p.createOtp) return p.createOtp(phone);
    const code = randomOtp();
    const r = await p.sendOtp(phone, code);
    return { code, providerRef: r.providerRef };
  }
  async sendTemplate(phone: string, t: SmsTemplate, args: string[]) { return (await this.current()).sendTemplate(phone, t, args); }
  supports(t: SmsTemplate) { return (cache?.provider ?? this.fallback).supports(t); }
}
