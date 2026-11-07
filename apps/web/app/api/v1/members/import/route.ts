import { AppError, importMembersCsv } from "@smartgym/core";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

const MAX_BYTES = 2_000_000;

/** Body: the CSV file as text/csv. ?dryRun=1 only checks it. All rows are imported or none. */
export const POST = tenantRoute(async ({ req, tenant }) => {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BYTES) throw new AppError("BAD_REQUEST", "حجم فایل بیش از ۲ مگابایت است.");
  const text = await req.text();
  if (text.length > MAX_BYTES) throw new AppError("BAD_REQUEST", "حجم فایل بیش از ۲ مگابایت است.");
  return importMembersCsv(coreDeps(), tenant, text, { dryRun: req.nextUrl.searchParams.get("dryRun") === "1" });
});
