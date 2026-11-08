import { listPaymentLinks } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { tenantRoute } from "@/lib/server/api";
import { appUrl, coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant, params }) => {
  const links = await listPaymentLinks(coreDeps(), tenant, uuid.parse(params.id));
  return links.map((l) => ({ ...l, url: `${appUrl()}/pay/${l.resNum}` }));
});
