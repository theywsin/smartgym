import { adminSetUserStatus } from "@smartgym/core";
import { adminUserStatusSchema, uuid } from "@smartgym/validation";
import { adminRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = adminRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminSetUserStatus(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), await parseJson(req, adminUserStatusSchema))
);
