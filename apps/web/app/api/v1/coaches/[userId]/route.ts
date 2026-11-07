import { updateCoach } from "@smartgym/core";
import { updateCoachSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PATCH = tenantRoute(async ({ req, tenant, params }) =>
  updateCoach(coreDeps(), tenant, uuid.parse(params.userId), await parseJson(req, updateCoachSchema))
);
