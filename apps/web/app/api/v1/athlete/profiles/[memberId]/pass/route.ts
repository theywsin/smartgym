import { issueCheckinPass } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** POST so the token is never cached or prefetched. */
export const POST = userRoute(async ({ auth, params }) =>
  issueCheckinPass(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId))
);
