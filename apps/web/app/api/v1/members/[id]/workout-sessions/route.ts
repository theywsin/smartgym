import { listMemberWorkoutSessions } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant, params }) => listMemberWorkoutSessions(coreDeps(), tenant, uuid.parse(params.id)));
