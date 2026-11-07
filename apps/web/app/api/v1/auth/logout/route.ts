import { NextResponse } from "next/server";
import { revokeSession } from "@smartgym/core";
import { userRoute, clearWebSessionCookies } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ auth, requestId }) => {
  await revokeSession(coreDeps(), auth.user.id, auth.session.id);
  const res = NextResponse.json({ data: { loggedOut: true }, meta: { requestId } });
  clearWebSessionCookies(res);
  return res;
});
