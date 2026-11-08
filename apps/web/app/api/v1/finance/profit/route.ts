import { profitReport } from "@smartgym/core";
import { jalaliMonthQuerySchema } from "@smartgym/validation";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  profitReport(coreDeps(), tenant, jalaliMonthQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);
