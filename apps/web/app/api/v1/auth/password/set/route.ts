import { AppError, setPassword } from "@smartgym/core";
import { setPasswordSchema } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

const RECENT_LOGIN_MS = 10 * 60 * 1000;

/** Setting a password requires a fresh sign-in (OTP) in this session. */
export const POST = userRoute(async ({ req, auth }) => {
  if (Date.now() - auth.session.createdAt.getTime() > RECENT_LOGIN_MS) {
    throw new AppError("FORBIDDEN", "برای تغییر رمز عبور، ابتدا دوباره با کد پیامکی وارد شوید.");
  }
  const { password } = await parseJson(req, setPasswordSchema);
  await setPassword(coreDeps(), auth.user.id, password);
  return { updated: true };
});
