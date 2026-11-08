import { NextResponse, type NextRequest } from "next/server";
import { settleGatewayCallback } from "@smartgym/core";
import { gatewayCallbackSchema } from "@smartgym/validation";
import { appUrl, coreDeps, paymentGateway } from "@/lib/server/deps";

/**
 * The bank posts the payer's browser here (form-encoded). Not cookie-authenticated, so no CSRF check:
 * nothing in the body is trusted, the server verifies the RefNum with the bank before recording money.
 */
export async function POST(req: NextRequest) {
  let resNum: string | null = null;
  let status = "FAILED";
  try {
    const form = await req.formData();
    const cb = gatewayCallbackSchema.parse(Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])));
    const out = await settleGatewayCallback(coreDeps(), paymentGateway(), cb);
    resNum = out.resNum;
    status = out.status;
  } catch (err) {
    console.error(JSON.stringify({ level: "error", msg: "gateway callback failed", err: String(err) }));
  }
  const target = resNum ? `${appUrl()}/pay/${resNum}?result=${status.toLowerCase()}` : `${appUrl()}/pay/invalid`;
  return NextResponse.redirect(target, 303);
}
