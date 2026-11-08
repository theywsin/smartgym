import "server-only";
import path from "node:path";

/** Where admin-uploaded images are stored. Mount this directory as a volume in production. */
export function uploadDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads"));
}
