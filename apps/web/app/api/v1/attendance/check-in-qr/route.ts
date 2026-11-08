import { checkInWithPass } from "@smartgym/core";
import { qrCheckInSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, qrCheckInSchema);
  return ok(await checkInWithPass(coreDeps(), tenant, input), { status: 201 }, requestId);
});
