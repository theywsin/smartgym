import { createBranch, listBranches } from "@smartgym/core";
import { createBranchSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant }) => listBranches(coreDeps(), tenant));

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, createBranchSchema);
  return ok(await createBranch(coreDeps(), tenant, input), { status: 201 }, requestId);
});
