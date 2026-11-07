import { getPublicPayment } from "@smartgym/core";
import { z } from "zod";
import { publicRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";
import { limit } from "@/lib/server/rateLimit";


export const GET = publicRoute(async ({ params, ip }) => {
  limit(`pay-view:${ip}`, 60, 60_000);
  return getPublicPayment(coreDeps(), z.string().regex(/^[A-Za-z0-9_-]{24}$/).parse(params.resNum));
});
