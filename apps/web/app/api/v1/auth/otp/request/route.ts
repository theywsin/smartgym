import { requestOtp } from "@smartgym/core";
import { otpRequestSchema } from "@smartgym/validation";
import { publicRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const POST = publicRoute(async ({ req, ip, requestId }) => {
  const input = await parseJson(req, otpRequestSchema);
  const result = await requestOtp(coreDeps(), { phone: input.phone, purpose: input.purpose, ip });
  return ok(result, { status: 202 }, requestId);
});
