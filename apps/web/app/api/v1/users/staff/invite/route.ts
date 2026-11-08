import { inviteStaff } from "@smartgym/core";
import { inviteStaffSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, inviteStaffSchema);
  return ok(await inviteStaff(coreDeps(), tenant, input), { status: 201 }, requestId);
});
