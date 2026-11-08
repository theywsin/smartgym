import crypto from "node:crypto";

/** Result of a successful token request: where to send the payer's browser. */
export interface GatewayToken {
  token: string;
  redirectUrl: string;
}

export interface GatewayVerifyResult {
  ok: boolean;
  /** Amount the bank actually settled (rial). Must equal the request amount. */
  amountRial?: bigint;
  rrn?: string;
  cardMask?: string;
  error?: string;
}

/** Fields the bank POSTs back to the callback URL (Saman SEP names). */
export interface GatewayCallback {
  State?: string;
  Status?: string;
  RefNum?: string;
  ResNum?: string;
  Rrn?: string;
  SecurePan?: string;
  TerminalId?: string;
  Amount?: string;
}

export interface PaymentGateway {
  readonly name: string;
  requestToken(args: { terminalId: string; amountRial: bigint; resNum: string; callbackUrl: string; cellNumber?: string }): Promise<GatewayToken>;
  verify(args: { terminalId: string; refNum: string }): Promise<GatewayVerifyResult>;
  reverse(args: { terminalId: string; refNum: string }): Promise<boolean>;
}

export class GatewayError extends Error {}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const SEP = "https://sep.shaparak.ir";

/**
 * Saman Electronic Payment (SEP) online gateway.
 * Token -> redirect -> POST callback -> server-side VerifyTransaction (ReverseTransaction on mismatch).
 * The callback fields are never trusted: only VerifyTransaction decides whether money moved.
 */
export class SamanGateway implements PaymentGateway {
  readonly name = "saman";
  constructor(private readonly fetchFn: FetchLike = fetch as unknown as FetchLike, private readonly baseUrl = SEP) {}

  private async post(path: string, body: unknown): Promise<Record<string, unknown>> {
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new GatewayError(`SEP HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }

  async requestToken(args: Parameters<PaymentGateway["requestToken"]>[0]): Promise<GatewayToken> {
    const data = await this.post("/onlinepg/onlinepg", {
      action: "token",
      TerminalId: args.terminalId,
      Amount: Number(args.amountRial),
      ResNum: args.resNum,
      RedirectUrl: args.callbackUrl,
      ...(args.cellNumber ? { CellNumber: args.cellNumber } : {}),
    });
    if (Number(data.status) !== 1 || typeof data.token !== "string") {
      throw new GatewayError(`SEP token error ${String(data.errorCode ?? "")}: ${String(data.errorDesc ?? "")}`);
    }
    return { token: data.token, redirectUrl: `${this.baseUrl}/OnlinePG/SendToken?token=${encodeURIComponent(data.token)}` };
  }

  async verify(args: { terminalId: string; refNum: string }): Promise<GatewayVerifyResult> {
    const data = await this.post("/verifyTxnRandomSessionkey/ipg/VerifyTransaction", {
      RefNum: args.refNum,
      TerminalNumber: Number(args.terminalId),
    });
    const detail = (data.TransactionDetail ?? {}) as Record<string, unknown>;
    if (Number(data.ResultCode) !== 0 || data.Success === false) {
      return { ok: false, error: `${String(data.ResultCode)} ${String(data.ResultDescription ?? "")}` };
    }
    return {
      ok: true,
      amountRial: BigInt(String(detail.AffectiveAmount ?? detail.OrginalAmount ?? "0")),
      rrn: detail.RRN != null ? String(detail.RRN) : undefined,
      cardMask: detail.MaskedPan != null ? String(detail.MaskedPan) : undefined,
    };
  }

  async reverse(args: { terminalId: string; refNum: string }): Promise<boolean> {
    try {
      const data = await this.post("/verifyTxnRandomSessionkey/ipg/ReverseTransaction", {
        RefNum: args.refNum,
        TerminalNumber: Number(args.terminalId),
      });
      return Number(data.ResultCode) === 0;
    } catch {
      return false;
    }
  }
}

/**
 * Development and E2E stand-in for the bank. The "bank page" is /pay/sandbox in the app.
 * RefNums are HMAC-signed so verify can tell the amount without storing state, and a forged one fails.
 */
export class SandboxGateway implements PaymentGateway {
  readonly name = "sandbox";
  constructor(private readonly secret: string, private readonly appUrl: string) {}

  private sign(s: string) {
    return crypto.createHmac("sha256", this.secret).update(s).digest("base64url").slice(0, 16);
  }

  async requestToken(args: Parameters<PaymentGateway["requestToken"]>[0]): Promise<GatewayToken> {
    const payload = `${args.resNum}.${args.amountRial}`;
    const token = `${Buffer.from(payload).toString("base64url")}.${this.sign(payload)}`;
    const url = new URL("/pay/sandbox", this.appUrl);
    url.searchParams.set("token", token);
    url.searchParams.set("callback", args.callbackUrl);
    return { token, redirectUrl: url.toString() };
  }

  /** What the sandbox bank page posts back on "success". */
  refNumFor(token: string): string | null {
    const [p, sig] = token.split(".");
    if (!p || !sig) return null;
    const payload = Buffer.from(p, "base64url").toString();
    if (this.sign(payload) !== sig) return null;
    const ref = `SBX${crypto.randomBytes(6).toString("hex")}.${p}`;
    return `${ref}.${this.sign(ref)}`;
  }

  async verify(args: { terminalId: string; refNum: string }): Promise<GatewayVerifyResult> {
    const i = args.refNum.lastIndexOf(".");
    const ref = args.refNum.slice(0, i);
    if (i < 0 || this.sign(ref) !== args.refNum.slice(i + 1)) return { ok: false, error: "invalid sandbox RefNum" };
    const payload = Buffer.from(ref.split(".")[1] ?? "", "base64url").toString();
    const amount = payload.split(".")[1];
    return { ok: true, amountRial: BigInt(amount ?? "0"), rrn: ref.slice(3, 15), cardMask: "603799******0000" };
  }

  async reverse(): Promise<boolean> {
    return true;
  }
}

export function createGatewayFromEnv(env: Record<string, string | undefined>, secret: string): PaymentGateway {
  const mode = env.PAYMENT_GATEWAY ?? (env.NODE_ENV === "production" ? "saman" : "sandbox");
  if (mode === "saman") return new SamanGateway();
  if (mode === "sandbox") {
    if (env.NODE_ENV === "production" && env.ALLOW_SANDBOX_GATEWAY !== "true") {
      throw new Error("PAYMENT_GATEWAY=sandbox is not allowed in production.");
    }
    return new SandboxGateway(secret, env.APP_URL ?? "http://localhost:3000");
  }
  throw new Error(`Unknown PAYMENT_GATEWAY "${mode}"`);
}
