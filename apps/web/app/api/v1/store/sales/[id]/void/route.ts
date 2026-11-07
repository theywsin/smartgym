import { voidSale } from "@smartgym/core";
import { uuid, voidExpenseSchema } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, params }) =>
  voidSale(coreDeps(), tenant, uuid.parse(params.id), (await parseJson(req, voidExpenseSchema)).reason)
);
