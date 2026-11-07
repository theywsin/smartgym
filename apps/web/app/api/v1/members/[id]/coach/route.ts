import { assignCoach } from "@smartgym/core";
import { assignCoachSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, params }) => {
  const { coachUserId } = await parseJson(req, assignCoachSchema);
  await assignCoach(coreDeps(), tenant, uuid.parse(params.id), coachUserId);
  return { coachUserId };
});
