import { startOnlinePayment } from "@smartgym/core";
import { z } from "zod";
import { publicRoute } from "@/lib/server/api";
import { appUrl, coreDeps, paymentGateway } from "@/lib/server/deps";
import { limit } from "@/lib/server/rateLimit";

export const POST = publicRoute(async ({ params, ip }) => {
  limit(`pay-start:${ip}`, 10, 60_000);
  const resNum = z.string().regex(/^[A-Za-z0-9_-]{24}$/).parse(params.resNum);
  return startOnlinePayment(coreDeps(), paymentGateway(), resNum, `${appUrl()}/api/v1/payments/saman/callback`);
});
