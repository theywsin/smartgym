import { adminListUsers } from "@smartgym/core";
import { adminUserListSchema } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ req, auth }) => adminListUsers(coreDeps(), { userId: auth.user.id }, adminUserListSchema.parse(Object.fromEntries(req.nextUrl.searchParams))));
