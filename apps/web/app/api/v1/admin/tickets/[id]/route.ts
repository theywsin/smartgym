import { adminGetTicket } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ auth, params }) => adminGetTicket(coreDeps(), { userId: auth.user.id }, uuid.parse(params.id)));
