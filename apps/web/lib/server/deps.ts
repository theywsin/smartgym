import "server-only";
import { getPrisma } from "@smartgym/db";
import { createSmsProviderFromEnv, createAiProviderFromEnv, SettingsSmsProvider, createGatewayFromEnv, DEFAULT_CONFIG, type CoreDeps, type PaymentGateway } from "@smartgym/core";
import { env } from "./env";

let deps: CoreDeps | undefined;

export function coreDeps(): CoreDeps {
  if (deps) return deps;
  const e = env();
  deps = {
    db: getPrisma(),
    // Melipayamak settings from the platform admin win; otherwise SMS_PROVIDER from the environment.
    sms: new SettingsSmsProvider(() => deps!, createSmsProviderFromEnv(process.env)),
    ai: createAiProviderFromEnv(process.env),
    config: { ...DEFAULT_CONFIG, otpPepper: e.OTP_PEPPER, jwtSecret: e.JWT_SECRET, aiDailyLimitPerGym: Number(process.env.AI_DAILY_LIMIT_PER_GYM) || 50 },
  };
  return deps;
}

let gw: PaymentGateway | undefined;

/** Bank gateway: Saman in production, the in-app sandbox in development (PAYMENT_GATEWAY overrides). */
export function paymentGateway(): PaymentGateway {
  gw ??= createGatewayFromEnv(process.env, env().JWT_SECRET);
  return gw;
}

/** Public base URL for links sent to members and for the bank callback. */
export function appUrl(): string {
  const url = env().APP_URL;
  if (!url) throw new Error("APP_URL must be set for online payments.");
  return url.replace(/\/$/, "");
}
