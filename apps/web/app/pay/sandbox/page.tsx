import { notFound } from "next/navigation";
import { SandboxGateway } from "@smartgym/core";
import { appUrl, paymentGateway } from "@/lib/server/deps";

export const dynamic = "force-dynamic";

/** Fake bank page for development and E2E. Exists only when PAYMENT_GATEWAY=sandbox. */
export default async function SandboxBank({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const gw = paymentGateway();
  if (!(gw instanceof SandboxGateway)) notFound();
  const { token = "" } = await searchParams;
  const refNum = gw.refNumFor(token);
  if (!refNum) notFound();
  const payload = Buffer.from(token.split(".")[0] ?? "", "base64url").toString();
  const [resNum, amount] = payload.split(".");
  const action = `${appUrl()}/api/v1/payments/saman/callback`;
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="card w-full max-w-[420px] space-y-4 p-6">
        <p className="rounded-lg bg-warn-bg p-2 text-center text-xs font-bold">درگاه آزمایشی: پولی جابه‌جا نمی‌شود</p>
        <h1 className="text-lg font-extrabold">بانک آزمایشی</h1>
        <p className="text-sm">مبلغ: <span className="ltr-nums">{amount}</span> ریال</p>
        <form method="post" action={action}>
          <input type="hidden" name="ResNum" value={resNum} />
          <input type="hidden" name="RefNum" value={refNum} />
          <input type="hidden" name="Status" value="2" />
          <input type="hidden" name="State" value="OK" />
          <button type="submit" className="btn-primary w-full">پرداخت موفق</button>
        </form>
        <form method="post" action={action}>
          <input type="hidden" name="ResNum" value={resNum} />
          <input type="hidden" name="Status" value="1" />
          <input type="hidden" name="State" value="CanceledByUser" />
          <button type="submit" className="btn-secondary w-full">انصراف</button>
        </form>
      </div>
    </main>
  );
}
