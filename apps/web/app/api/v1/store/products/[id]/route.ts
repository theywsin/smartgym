import { updateProduct } from "@smartgym/core";
import { updateProductSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PATCH = tenantRoute(async ({ req, tenant, params }) =>
  updateProduct(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, updateProductSchema))
);
