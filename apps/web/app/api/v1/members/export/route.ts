import { exportMembersCsv } from "@smartgym/core";
import { tenantRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

/** CSV with a UTF-8 BOM so Excel shows Persian text correctly. */
export const GET = tenantRoute(async ({ tenant }) => {
  const { csv, filename } = await exportMembersCsv(coreDeps(), tenant);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
});
