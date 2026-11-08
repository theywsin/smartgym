import { getPlatformSettings, listPublicPlans } from "@smartgym/core";
import { publicRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** Public site content and active SaaS plans (landing page, footer, signup). */
export const GET = publicRoute(async () => {
  const [settings, plans] = await Promise.all([getPlatformSettings(coreDeps()), listPublicPlans(coreDeps())]);
  return { settings, plans };
});
