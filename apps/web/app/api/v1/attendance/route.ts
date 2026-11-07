import { listAttendance } from "@smartgym/core";
import { listAttendanceSchema } from "@smartgym/validation";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ req, tenant }) =>
  listAttendance(coreDeps(), tenant, listAttendanceSchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);
