import "server-only";
import { z } from "zod";

const secret = z.string().min(32, "must be at least 32 characters");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  OTP_PEPPER: secret,
  JWT_SECRET: secret,
  SMS_PROVIDER: z.enum(["console", "melipayamak", "kavenegar"]).optional(),
  APP_URL: z.url().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated server environment. Fails fast with a readable message. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
