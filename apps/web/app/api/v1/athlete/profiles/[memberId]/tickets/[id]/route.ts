import { athleteGetTicket } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth, params }) => athleteGetTicket(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId), uuid.parse(params.id)));
