import { createMembershipPlan, listMembershipPlans } from "@smartgym/core";
import { membershipPlanSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  listMembershipPlans(coreDeps(), tenant, { includeInactive: req.nextUrl.searchParams.get("all") === "1" })
);

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, membershipPlanSchema);
  return ok(await createMembershipPlan(coreDeps(), tenant, input), { status: 201 }, requestId);
});
