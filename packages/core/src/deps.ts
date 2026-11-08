import type { PrismaClient } from "@smartgym/db";
import type { SmsProvider } from "./sms";
import type { AiProvider } from "./ai";

export interface CoreConfig {
  /** Secret mixed into OTP hashes (32+ chars). */
  otpPepper: string;
  /** HS256 secret for mobile access tokens (32+ chars). */
  jwtSecret: string;
  /** Lifetimes */
  otpTtlSeconds: number;
  accessTokenTtlSeconds: number;
  webSessionIdleSeconds: number;
  sessionAbsoluteSeconds: number;
  /** Max gyms a single user can register (abuse guard). */
  maxOwnedGyms: number;
  /** AI calls per gym per rolling 24h. */
  aiDailyLimitPerGym?: number;
}

export interface CoreDeps {
  db: PrismaClient;
  sms: SmsProvider;
  /** Undefined when AI_PROVIDER is not configured. */
  ai?: AiProvider;
  config: CoreConfig;
  now?: () => Date;
}

export const DEFAULT_CONFIG: Omit<CoreConfig, "otpPepper" | "jwtSecret"> = {
  otpTtlSeconds: 120,
  accessTokenTtlSeconds: 15 * 60,
  webSessionIdleSeconds: 7 * 24 * 3600,
  sessionAbsoluteSeconds: 30 * 24 * 3600,
  maxOwnedGyms: 5,
};

export function nowOf(deps: Pick<CoreDeps, "now">): Date {
  return deps.now ? deps.now() : new Date();
}
