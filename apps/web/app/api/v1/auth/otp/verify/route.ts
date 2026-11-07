import { NextResponse } from "next/server";
import { createSession, issueAccessToken, listMyGyms, verifyOtp } from "@smartgym/core";
import { otpVerifySchema } from "@smartgym/validation";
import { publicRoute, parseJson, isMobileClient, setWebSessionCookies } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/**
 * Verifies the code and signs the user in.
 * Web: sets the HttpOnly session cookie. Mobile (X-Client: mobile): returns access + refresh tokens.
 * If the user belongs to exactly one gym, it becomes the active gym.
 */
export const POST = publicRoute(async ({ req, ip, userAgent, requestId }) => {
  const deps = coreDeps();
  const input = await parseJson(req, otpVerifySchema);
  const { user, isNewUser } = await verifyOtp(deps, { phone: input.phone, code: input.code });
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

  const body = { user: { id: user.id, phone: user.phone, isNewUser }, gyms, activeGymId };
  if (mobile) {
    const accessToken = await issueAccessToken(deps, session);
    return NextResponse.json({ data: { ...body, accessToken, refreshToken: token }, meta: { requestId } });
  }
  const res = NextResponse.json({ data: body, meta: { requestId } });
  setWebSessionCookies(res, token);
  return res;
});
