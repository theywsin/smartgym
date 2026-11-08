import { adminListGyms } from "@smartgym/core";
import { adminGymListSchema } from "@smartgym/validation";
import { adminRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = adminRoute(async ({ req, auth }) =>
  adminListGyms(coreDeps(), { userId: auth.user.id }, adminGymListSchema.parse(Object.fromEntries(req.nextUrl.searchParams)))
);
