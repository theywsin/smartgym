import { createPaymentLink } from "@smartgym/core";
import { paymentLinkSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { appUrl, coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  const link = await createPaymentLink(coreDeps(), tenant, await parseJson(req, paymentLinkSchema));
  return ok({ ...link, url: `${appUrl()}/pay/${link.resNum}` }, { status: 201 }, requestId);
});
