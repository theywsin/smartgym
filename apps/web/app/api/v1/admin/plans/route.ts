import { adminListPlans, adminListPlansFull, adminSavePlan } from "@smartgym/core";
import { adminPlanSchema } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** ?full=1 returns every plan with modules and limits for the plans editor. */
export const GET = userRoute(async ({ req, auth }) =>
  req.nextUrl.searchParams.get("full") ? adminListPlansFull(coreDeps(), { userId: auth.user.id }) : adminListPlans(coreDeps(), { userId: auth.user.id })
);
export const POST = userRoute(async ({ req, auth, ip, userAgent }) => adminSavePlan(coreDeps(), { userId: auth.user.id, ip, userAgent }, null, await parseJson(req, adminPlanSchema)));
