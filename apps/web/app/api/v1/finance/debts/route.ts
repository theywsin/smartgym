import { listDebts } from "@smartgym/core";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant }) => listDebts(coreDeps(), tenant));
