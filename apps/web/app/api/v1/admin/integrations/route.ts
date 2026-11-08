import { adminGetIntegrations, adminSetIntegrations } from "@smartgym/core";
import { integrationsSchema } from "@smartgym/validation";
import { adminRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ auth, ip, userAgent }) => adminGetIntegrations(coreDeps(), { userId: auth.user.id, ip, userAgent }));
export const PUT = adminRoute(async ({ req, auth, ip, userAgent }) =>
  adminSetIntegrations(coreDeps(), { userId: auth.user.id, ip, userAgent }, await parseJson(req, integrationsSchema))
);
