import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_EXT_MIME } from "@smartgym/core";
import { uploadDir } from "@/lib/server/uploads";

/** Public, immutable images uploaded by platform admins. File names are random UUIDs. */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const m = /^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/.exec(name);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": UPLOAD_EXT_MIME[m[1]!]!,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
