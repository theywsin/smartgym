import { setExpenseCategoryActive } from "@smartgym/core";
import { expenseCategoryUpdateSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PATCH = tenantRoute(async ({ req, tenant, params }) =>
  setExpenseCategoryActive(coreDeps(), tenant, uuid.parse(params.id), (await parseJson(req, expenseCategoryUpdateSchema)).isActive)
);
