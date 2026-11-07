import { adminListGyms } from "@smartgym/core";
import { adminGymListSchema } from "@smartgym/validation";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ req, auth }) =>
  adminListGyms(coreDeps(), { userId: auth.user.id }, adminGymListSchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);
