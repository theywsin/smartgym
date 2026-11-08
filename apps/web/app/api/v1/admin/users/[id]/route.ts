import { adminGetUser } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ auth, params, ip, userAgent }) => adminGetUser(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id)));
