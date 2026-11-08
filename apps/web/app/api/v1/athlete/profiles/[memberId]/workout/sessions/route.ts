import { athleteStartWorkout } from "@smartgym/core";
import { uuid, workoutStartSchema } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth, params }) =>
  athleteStartWorkout(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId), (await parseJson(req, workoutStartSchema)).dayIndex)
);
