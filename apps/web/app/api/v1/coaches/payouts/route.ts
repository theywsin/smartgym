import { payCoachCommission } from "@smartgym/core";
import { coachPayoutSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, requestId }) =>
  ok(await payCoachCommission(coreDeps(), tenant, await parseJson(req, coachPayoutSchema)), { status: 201 }, requestId)
);
