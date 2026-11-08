import { adminSavePlan } from "@smartgym/core";
import { adminPlanSchema, uuid } from "@smartgym/validation";
import { adminRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PUT = adminRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminSavePlan(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), await parseJson(req, adminPlanSchema))
);
