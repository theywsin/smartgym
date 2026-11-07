import { registerGym, setActiveGym } from "@smartgym/core";
import { registerGymSchema } from "@smartgym/validation";
import { userRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** A signed-in user creates their gym (14-day trial) and switches into it. */
export const POST = userRoute(async ({ req, auth, ip, userAgent, requestId }) => {
  const deps = coreDeps();
  const input = await parseJson(req, registerGymSchema);
  const gym = await registerGym(deps, auth.user.id, input, { ip, userAgent });
  await setActiveGym(deps, auth.session, gym.id);
  return ok({ id: gym.id, name: gym.name, slug: gym.slug, status: gym.status }, { status: 201 }, requestId);
});
