import { checkIn } from "@smartgym/core";
import { checkInSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, checkInSchema);
  return ok(await checkIn(coreDeps(), tenant, input), { status: 201 }, requestId);
});
