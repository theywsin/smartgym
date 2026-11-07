import { setActiveGym } from "@smartgym/core";
import { activeGymSchema } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth }) => {
  const { gymId } = await parseJson(req, activeGymSchema);
  await setActiveGym(coreDeps(), auth.session, gymId);
  return { activeGymId: gymId };
});
