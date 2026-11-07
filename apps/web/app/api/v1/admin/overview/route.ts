import { adminOverview } from "@smartgym/core";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth, ip, userAgent }) => adminOverview(coreDeps(), { userId: auth.user.id, ip, userAgent }));
