import { addMemberNote, listMemberNotes } from "@smartgym/core";
import { memberNoteSchema, uuid } from "@smartgym/validation";
import { tenantRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant, params }) => listMemberNotes(coreDeps(), tenant, uuid.parse(params.id)));

export const POST = tenantRoute(async ({ req, tenant, params, requestId }) => {
  const { body } = await parseJson(req, memberNoteSchema);
  return ok(await addMemberNote(coreDeps(), tenant, uuid.parse(params.id), body), { status: 201 }, requestId);
});
