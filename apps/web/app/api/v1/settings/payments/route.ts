import { getOnlinePaymentSettings, setOnlinePaymentSettings } from "@smartgym/core";
import { onlinePaymentSettingsSchema } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant }) => getOnlinePaymentSettings(coreDeps(), tenant));

export const PUT = tenantRoute(async ({ req, tenant }) =>
  setOnlinePaymentSettings(coreDeps(), tenant, await parseJson(req, onlinePaymentSettingsSchema))
);
