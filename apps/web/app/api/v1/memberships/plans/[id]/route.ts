import { updateMembershipPlan } from "@smartgym/core";
import { updateMembershipPlanSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PATCH = tenantRoute(async ({ req, tenant, params }) =>
  updateMembershipPlan(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, updateMembershipPlanSchema))
);
