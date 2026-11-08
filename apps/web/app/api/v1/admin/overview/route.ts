import { adminOverview } from "@smartgym/core";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ auth, ip, userAgent }) => adminOverview(coreDeps(), { userId: auth.user.id, ip, userAgent }));
