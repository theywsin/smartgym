import { getMember, updateMember } from "@smartgym/core";
import { updateMemberSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant, params }) => getMember(coreDeps(), tenant, uuid.parse(params.id)));

export const PATCH = tenantRoute(async ({ req, tenant, params }) =>
  updateMember(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, updateMemberSchema))
);
