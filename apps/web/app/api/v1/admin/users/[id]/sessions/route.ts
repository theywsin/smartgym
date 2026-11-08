import { adminRevokeUserSessions } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const DELETE = adminRoute(async ({ auth, params, ip, userAgent }) => adminRevokeUserSessions(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id)));
