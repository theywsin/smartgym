import { rotateRefreshToken } from "@smartgym/core";
import { refreshSchema } from "@smartgym/validation";
import { publicRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** Mobile only: exchanges a refresh token for a new access + refresh token pair. */
export const POST = publicRoute(async ({ req, ip, userAgent }) => {
  const { refreshToken } = await parseJson(req, refreshSchema);
  const next = await rotateRefreshToken(coreDeps(), refreshToken, { ip, userAgent });
  return { accessToken: next.accessToken, refreshToken: next.refreshToken };
});
