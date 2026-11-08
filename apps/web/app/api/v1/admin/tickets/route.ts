import { adminListTickets } from "@smartgym/core";
import { ticketListSchema } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ req, auth }) => adminListTickets(coreDeps(), { userId: auth.user.id }, ticketListSchema.parse(Object.fromEntries(req.nextUrl.searchParams)).status));
