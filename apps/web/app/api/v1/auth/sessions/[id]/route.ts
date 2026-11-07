import { revokeSession } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const DELETE = userRoute(async ({ auth, params }) => {
  const id = uuid.parse(params.id);
  await revokeSession(coreDeps(), auth.user.id, id);
  return { revoked: true };
});
