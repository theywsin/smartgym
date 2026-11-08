import { athleteFinishWorkout } from "@smartgym/core";
import { uuid, workoutFinishSchema } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth, params }) =>
  athleteFinishWorkout(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId), uuid.parse(params.sessionId), (await parseJson(req, workoutFinishSchema)).note)
);
