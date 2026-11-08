import { changeStock } from "@smartgym/core";
import { stockChangeSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, params }) =>
  changeStock(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, stockChangeSchema))
);
