import { cashReport } from "@smartgym/core";
import { cashReportSchema } from "@smartgym/validation";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  cashReport(coreDeps(), tenant, cashReportSchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);
