import { refundPayment } from "@smartgym/core";
import { refundSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, params, requestId }) =>
  ok(await refundPayment(coreDeps(), tenant, uuid.parse(params.id), await parseJson(req, refundSchema)), { status: 201 }, requestId)
);
