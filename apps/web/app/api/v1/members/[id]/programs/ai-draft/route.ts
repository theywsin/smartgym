import { draftWorkoutProgram } from "@smartgym/core";
import { uuid, aiWorkoutDraftSchema } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, params }) =>
  draftWorkoutProgram(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, aiWorkoutDraftSchema))
);
