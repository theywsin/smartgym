import { adminListAudit } from "@smartgym/core";
import { adminAuditListSchema } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ req, auth }) => adminListAudit(coreDeps(), { userId: auth.user.id }, adminAuditListSchema.parse(Object.fromEntries(req.nextUrl.searchParams))));
