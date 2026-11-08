import { athleteListTickets, athleteOpenTicket } from "@smartgym/core";
import { ticketCreateSchema, uuid } from "@smartgym/validation";
import { userRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth, params }) => athleteListTickets(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId)));
export const POST = userRoute(async ({ req, auth, params, requestId }) =>
  ok(await athleteOpenTicket(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId), await parseJson(req, ticketCreateSchema)), { status: 201 }, requestId)
);
