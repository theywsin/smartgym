import { staffReplyTicket } from "@smartgym/core";
import { ticketReplySchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ req, tenant, params }) => staffReplyTicket(coreDeps(), tenant, uuid.parse(params.id), (await parseJson(req, ticketReplySchema)).body));
