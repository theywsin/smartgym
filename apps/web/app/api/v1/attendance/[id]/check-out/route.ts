import { checkOut } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = tenantRoute(async ({ tenant, params }) => checkOut(coreDeps(), tenant, uuid.parse(params.id)));
