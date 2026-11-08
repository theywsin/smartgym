import { adminCloseTicket } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = adminRoute(async ({ auth, params }) => adminCloseTicket(coreDeps(), { userId: auth.user.id }, uuid.parse(params.id)));
