import { createExpense, listExpenses } from "@smartgym/core";
import { expenseSchema, jalaliMonthQuerySchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  listExpenses(coreDeps(), tenant, jalaliMonthQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);

export const POST = tenantRoute(async ({ req, tenant, requestId }) =>
  ok(await createExpense(coreDeps(), tenant, await parseJson(req, expenseSchema)), { status: 201 }, requestId)
);
