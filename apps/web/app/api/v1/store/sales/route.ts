import { createSale, listSales } from "@smartgym/core";
import { listSalesSchema, saleSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  listSales(coreDeps(), tenant, listSalesSchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);

/** Optional Idempotency-Key header: a double-tapped "pay" records one sale. */
export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const key = req.headers.get("idempotency-key")?.slice(0, 100) || undefined;
  return ok(await createSale(coreDeps(), tenant, await parseJson(req, saleSchema), key), { status: 201 }, requestId);
});
