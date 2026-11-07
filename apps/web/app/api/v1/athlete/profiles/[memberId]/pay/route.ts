import { athleteStartDebtPayment } from "@smartgym/core";
import { uuid } from "@smartgym/validation";
import { z } from "zod";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = userRoute(async ({ req, auth, params }) => {
  const { subscriptionId } = await parseJson(req, z.object({ subscriptionId: uuid }));
  return athleteStartDebtPayment(coreDeps(), { id: auth.user.id, phone: auth.user.phone }, uuid.parse(params.memberId), subscriptionId);
});
