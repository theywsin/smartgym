import { createExpenseCategory, listExpenseCategories } from "@smartgym/core";
import { expenseCategorySchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant }) => listExpenseCategories(coreDeps(), tenant));

export const POST = tenantRoute(async ({ req, tenant, requestId }) =>
  ok(await createExpenseCategory(coreDeps(), tenant, await parseJson(req, expenseCategorySchema)), { status: 201 }, requestId)
);
