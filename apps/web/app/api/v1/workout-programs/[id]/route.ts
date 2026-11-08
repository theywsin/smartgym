import { updateProgram } from "@smartgym/core";
import { uuid, workoutProgramSchema } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PUT = tenantRoute(async ({ req, tenant, params }) =>
  updateProgram(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, workoutProgramSchema))
);
