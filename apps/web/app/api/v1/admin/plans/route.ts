import { adminListPlans } from "@smartgym/core";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth }) => adminListPlans(coreDeps(), { userId: auth.user.id }));
