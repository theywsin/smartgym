import { listMyMemberProfiles } from "@smartgym/core";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth }) => listMyMemberProfiles(coreDeps(), { id: auth.user.id, phone: auth.user.phone }));
