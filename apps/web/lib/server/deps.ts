import "server-only";
import { getPrisma } from "@smartgym/db";
import { createSmsProviderFromEnv, DEFAULT_CONFIG, type CoreDeps } from "@smartgym/core";
import { env } from "./env";

let deps: CoreDeps | undefined;

export function coreDeps(): CoreDeps {
  if (deps) return deps;
  const e = env();
  deps = {
    db: getPrisma(),
    sms: createSmsProviderFromEnv(process.env),
    config: { ...DEFAULT_CONFIG, otpPepper: e.OTP_PEPPER, jwtSecret: e.JWT_SECRET },
  };
  return deps;
}
