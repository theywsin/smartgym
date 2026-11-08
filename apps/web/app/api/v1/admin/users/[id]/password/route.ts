import { adminSetUserPassword } from "@smartgym/core";
import { setPasswordSchema, uuid } from "@smartgym/validation";
import { adminRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = adminRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminSetUserPassword(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), (await parseJson(req, setPasswordSchema)).password)
);
