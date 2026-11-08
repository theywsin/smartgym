import { adminGetGym, adminUpdateGym } from "@smartgym/core";
import { adminGymUpdateSchema, uuid } from "@smartgym/validation";
import { adminRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ auth, params, ip, userAgent }) => adminGetGym(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id)));
export const PUT = adminRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminUpdateGym(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), await parseJson(req, adminGymUpdateSchema))
);
