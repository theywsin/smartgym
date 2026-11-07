import { staffListTickets, staffOpenPlatformTicket } from "@smartgym/core";
import { ticketCreateSchema, ticketListSchema } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) => staffListTickets(coreDeps(), tenant, ticketListSchema.parse(Object.fromEntries(req.nextUrl.searchParams))));
/** Staff open tickets only towards platform support; member tickets are opened by members. */
export const POST = tenantRoute(async ({ req, tenant, requestId }) => ok(await staffOpenPlatformTicket(coreDeps(), tenant, await parseJson(req, ticketCreateSchema)), { status: 201 }, requestId));
