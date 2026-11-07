import { adminCloseTicket } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ auth, params }) => adminCloseTicket(coreDeps(), { userId: auth.user.id }, uuid.parse(params.id)));
