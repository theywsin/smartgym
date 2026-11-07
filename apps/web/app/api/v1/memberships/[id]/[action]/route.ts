import { AppError, changeMembership } from "@smartgym/core";
import { membershipActionSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

const ACTIONS = ["suspend", "resume", "cancel"] as const;

export const POST = tenantRoute(async ({ req, tenant, params }) => {
  const action = ACTIONS.find((a) => a === params.action);
  if (!action) throw new AppError("NOT_FOUND", "عملیات یافت نشد.");
  const { note } = await parseJson(req, membershipActionSchema);
  return changeMembership(coreDeps(), tenant, uuid.parse(params.id), action, note);
});
