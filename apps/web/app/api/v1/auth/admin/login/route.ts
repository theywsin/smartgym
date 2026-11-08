import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, loginAdmin } from "@smartgym/core";
import { publicRoute, parseJson, setWebSessionCookies } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";
import { limit } from "@/lib/server/rateLimit";

const schema = z.object({ username: z.string().trim().min(1, "نام کاربری را وارد کنید.").max(64), password: z.string().min(1, "رمز عبور را وارد کنید.").max(200) });

/** Platform admin sign-in (username + password). Opens an ADMIN web session. */
export const POST = publicRoute(async ({ req, ip, userAgent, requestId }) => {
  const deps = coreDeps();
  const input = await parseJson(req, schema);
  limit(`admin:${ip}:${input.username.toLowerCase()}`, 5, 15 * 60 * 1000);
  limit(`admin-ip:${ip}`, 20, 15 * 60 * 1000);
  const user = await loginAdmin(deps, input.username, input.password);
  const { token } = await createSession(deps, { userId: user.id, kind: "ADMIN", activeGymId: null, ip, userAgent });
  const res = NextResponse.json({ data: { ok: true }, meta: { requestId } });
  setWebSessionCookies(res, token);
  return res;
});
