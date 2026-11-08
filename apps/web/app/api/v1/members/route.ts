import { createMember, listMembers } from "@smartgym/core";
import { listMembersSchema, memberInputSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  listMembers(coreDeps(), tenant, listMembersSchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, memberInputSchema);
  return ok(await createMember(coreDeps(), tenant, input), { status: 201 }, requestId);
});
