import { athleteReplyTicket } from "@smartgym/core";
import { ticketReplySchema, uuid } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth, params }) =>
  athleteReplyTicket(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId), uuid.parse(params.id), (await parseJson(req, ticketReplySchema)).body)
);
