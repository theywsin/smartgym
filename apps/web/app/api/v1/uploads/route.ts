import { AppError, MAX_UPLOAD_BYTES, requirePermission, staffSaveUpload } from "@smartgym/core";
import { tenantRoute, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";
import { uploadDir } from "@/lib/server/uploads";

/** Coach/staff image upload (exercise pictures and GIFs). Raw image bytes in the body. */
export const POST = tenantRoute(async ({ req, tenant, requestId }) => {
  requirePermission(tenant, "workouts.manage");
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES) throw new AppError("VALIDATION_FAILED", "حجم تصویر باید کمتر از ۵ مگابایت باشد.");
  const bytes = new Uint8Array(await req.arrayBuffer());
  return ok(await staffSaveUpload(coreDeps(), { userId: tenant.userId, gymId: tenant.gymId }, bytes, uploadDir()), { status: 201 }, requestId);
});
