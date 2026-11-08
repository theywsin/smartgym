import { createProgram, listPrograms } from "@smartgym/core";
import { uuid, workoutProgramSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant, params }) => listPrograms(coreDeps(), tenant, uuid.parse(params.id)));

export const POST = tenantRoute(async ({ req, tenant, params, requestId }) =>
  ok(await createProgram(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, workoutProgramSchema)), { status: 201 }, requestId)
);
