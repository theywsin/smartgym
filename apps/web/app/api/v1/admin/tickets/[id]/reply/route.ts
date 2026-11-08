import { adminReplyTicket } from "@smartgym/core";
import { ticketReplySchema, uuid } from "@smartgym/validation";
import { adminRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = adminRoute(async ({ req, auth, params }) => adminReplyTicket(coreDeps(), { userId: auth.user.id }, uuid.parse(params.id), (await parseJson(req, ticketReplySchema)).body));
