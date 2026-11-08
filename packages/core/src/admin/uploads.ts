import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { withSystem } from "@smartgym/db";
import { AppError } from "../errors";
import type { CoreDeps } from "../deps";
import type { AdminActor } from "./index";
import { adminAudit, requireSuperAdmin } from "./platform";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Detects the image type from its first bytes. SVG is refused on purpose (it can carry script). */
export function sniffImage(b: Uint8Array): { mime: string; ext: string; width: number | null; height: number | null } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { mime: "image/png", ext: "png", width: dv.getUint32(16), height: dv.getUint32(20) };
  }
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    // Walk JPEG markers to the SOFn frame header for the size.
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1]!;
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { mime: "image/jpeg", ext: "jpg", height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
      }
      i += 2 + dv.getUint16(i + 2);
    }
    return { mime: "image/jpeg", ext: "jpg", width: null, height: null };
  }
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") {
    return { mime: "image/webp", ext: "webp", width: null, height: null };
  }
  if (b.length > 10 && String.fromCharCode(...b.slice(0, 4)) === "GIF8") {
    return { mime: "image/gif", ext: "gif", width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
  }
  return null;
}

export const UPLOAD_EXT_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

/** Stores an admin-uploaded image on disk and records it. Returns its public URL. */
export async function adminSaveUpload(deps: CoreDeps, actor: AdminActor, bytes: Uint8Array, uploadDir: string) {
  return saveImage(deps, actor, bytes, uploadDir, true);
}

/** Coaches upload exercise pictures/GIFs. Caller must check the coach permission first. */
export async function staffSaveUpload(deps: CoreDeps, actor: AdminActor & { gymId: string }, bytes: Uint8Array, uploadDir: string) {
  return saveImage(deps, actor, bytes, uploadDir, false);
}

async function saveImage(deps: CoreDeps, actor: AdminActor & { gymId?: string }, bytes: Uint8Array, uploadDir: string, superAdmin: boolean) {
  if (bytes.length === 0) throw new AppError("VALIDATION_FAILED", "فایلی انتخاب نشده است.");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new AppError("VALIDATION_FAILED", "حجم تصویر باید کمتر از ۵ مگابایت باشد.");
  const kind = sniffImage(bytes);
  if (!kind) throw new AppError("VALIDATION_FAILED", "فقط تصویر PNG، JPG، WEBP یا GIF قابل بارگذاری است.");
  return withSystem(deps.db, async (tx) => {
    if (superAdmin) await requireSuperAdmin(tx, actor);
    const fileName = `${crypto.randomUUID()}.${kind.ext}`;
    await fs.mkdir(/*turbopackIgnore: true*/ uploadDir, { recursive: true });
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ uploadDir, fileName), bytes, { flag: "wx" });
    const row = await tx.platformUpload.create({
      data: { fileName, mimeType: kind.mime, sizeBytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex"), width: kind.width, height: kind.height, uploadedBy: actor.userId },
    });
    await adminAudit(tx, actor, superAdmin ? "platform.upload" : "gym.upload", "platform_upload", row.id, null, { fileName, sizeBytes: bytes.length, gymId: actor.gymId ?? null });
    return { id: row.id, url: `/uploads/${fileName}`, width: row.width, height: row.height };
  });
}

export async function adminListUploads(deps: CoreDeps, actor: AdminActor) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const rows = await tx.platformUpload.findMany({ orderBy: { createdAt: "desc" }, take: 60 });
    return rows.map((r) => ({ id: r.id, url: `/uploads/${r.fileName}`, width: r.width, height: r.height, sizeBytes: r.sizeBytes, createdAt: r.createdAt }));
  });
}
