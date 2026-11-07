import { adminSetGymPlan } from "@smartgym/core";
import { adminSetGymPlanSchema, uuid } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminSetGymPlan(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), await parseJson(req, adminSetGymPlanSchema))
);
