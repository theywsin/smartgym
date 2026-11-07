import { NextResponse } from "next/server";
import { createSession, issueAccessToken, listMyGyms, loginWithPassword } from "@smartgym/core";
import { passwordLoginSchema } from "@smartgym/validation";
import { publicRoute, parseJson, isMobileClient, setWebSessionCookies } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";
import { limit } from "@/lib/server/rateLimit";

export const POST = publicRoute(async ({ req, ip, userAgent, requestId }) => {
  const deps = coreDeps();
  const input = await parseJson(req, passwordLoginSchema);
  limit(`pwd:${ip}:${input.phone}`, 10, 15 * 60 * 1000);
  limit(`pwd-ip:${ip}`, 30, 15 * 60 * 1000);
  const user = await loginWithPassword(deps, input.phone, input.password);
  const gyms = await listMyGyms(deps, user.id);
  const activeGymId = gyms.length === 1 ? gyms[0]!.id : null;
  const mobile = isMobileClient(req);
  const { session, token } = await createSession(deps, {
    userId: user.id,
    kind: mobile ? "MOBILE" : "WEB",
    activeGymId,
    ip,
    userAgent,
    deviceName: input.deviceName,
  });
  const body = { user: { id: user.id, phone: user.phone }, gyms, activeGymId };
  if (mobile) {
    return NextResponse.json({ data: { ...body, accessToken: await issueAccessToken(deps, session), refreshToken: token }, meta: { requestId } });
  }
  const res = NextResponse.json({ data: body, meta: { requestId } });
  setWebSessionCookies(res, token);
  return res;
});
