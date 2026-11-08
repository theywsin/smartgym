import { adminListUploads, adminSaveUpload, MAX_UPLOAD_BYTES, AppError } from "@smartgym/core";
import { adminRoute, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";
import { uploadDir } from "@/lib/server/uploads";

export const GET = adminRoute(async ({ auth, ip, userAgent }) => adminListUploads(coreDeps(), { userId: auth.user.id, ip, userAgent }));

/** Raw image bytes in the body (Content-Type image/*). The type is checked from the bytes, not the header. */
export const POST = adminRoute(async ({ req, auth, ip, userAgent, requestId }) => {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES) throw new AppError("VALIDATION_FAILED", "حجم تصویر باید کمتر از ۵ مگابایت باشد.");
  const bytes = new Uint8Array(await req.arrayBuffer());
  return ok(await adminSaveUpload(coreDeps(), { userId: auth.user.id, ip, userAgent }, bytes, uploadDir()), { status: 201 }, requestId);
});
