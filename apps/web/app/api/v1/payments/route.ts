import { recordPayment } from "@smartgym/core";
import { recordPaymentSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** Optional Idempotency-Key header: a retried request returns the first payment instead of charging twice. */
export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const input = await parseJson(req, recordPaymentSchema);
  const key = req.headers.get("idempotency-key")?.slice(0, 100) || undefined;
  return ok(await recordPayment(coreDeps(), tenant, input, key), { status: 201 }, requestId);
});
