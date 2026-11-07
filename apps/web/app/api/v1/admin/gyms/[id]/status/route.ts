import { adminSetGymStatus } from "@smartgym/core";
import { adminSetGymStatusSchema, uuid } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminSetGymStatus(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), await parseJson(req, adminSetGymStatusSchema))
);
