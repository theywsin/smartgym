import { adminListUsers } from "@smartgym/core";
import { adminUserListSchema } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ req, auth }) => adminListUsers(coreDeps(), { userId: auth.user.id }, adminUserListSchema.parse(Object.fromEntries(req.nextUrl.searchParams))));
