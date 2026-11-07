import { sellMembership } from "@smartgym/core";
import { sellMembershipSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** Sell or renew a membership period. Payment recording arrives with the finance module (Phase 3). */
export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, sellMembershipSchema);
  return ok(await sellMembership(coreDeps(), tenant, input), { status: 201 }, requestId);
});
