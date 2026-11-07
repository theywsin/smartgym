import { createProduct, listProducts } from "@smartgym/core";
import { productSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) => {
  const b = req.nextUrl.searchParams.get("branchId");
  return listProducts(coreDeps(), tenant, { branchId: b ? uuid.parse(b) : undefined });
});

export const POST = tenantRoute(async ({ req, tenant, requestId }) =>
  ok(await createProduct(coreDeps(), tenant, await parseJson(req, productSchema)), { status: 201 }, requestId)
);
