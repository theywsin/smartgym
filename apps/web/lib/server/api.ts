import "server-only";
import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import {
  AppError,
  authenticateAccessToken,
  authenticateWebSession,
  loadTenantContext,
  type TenantContext,
} from "@smartgym/core";
import type { Session, User } from "@smartgym/db";
import { coreDeps } from "./deps";
import { env } from "./env";

export const SESSION_COOKIE = "sg_session";
export const CSRF_COOKIE = "sg_csrf";
export const CSRF_HEADER = "x-csrf-token";

export interface Auth {
  user: User;
  session: Session;
  via: "cookie" | "bearer";
}

export interface ApiContext {
  req: NextRequest;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  params: Record<string, string>;
}

type Handler<A> = (ctx: ApiContext & A) => Promise<NextResponse | Response | unknown>;

function clientIp(req: NextRequest): string | null {
  // Behind Nginx, which sets X-Real-IP; X-Forwarded-For first hop as fallback.
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export function ok(data: unknown, init: { status?: number; meta?: Record<string, unknown> } = {}, requestId?: string) {
  return NextResponse.json(
    { data: serialize(data), meta: { ...init.meta, requestId } },
    { status: init.status ?? 200 }
  );
}

/** JSON can't carry bigint; money goes out as a decimal string. */
function serialize(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)));
}

function errorResponse(err: unknown, requestId: string): NextResponse {
  if (err instanceof AppError) {
    const res = NextResponse.json(
      { error: { code: err.code, message: err.message, fields: err.fields }, meta: { requestId } },
      { status: err.status }
    );
    if (err.retryAfterSeconds) res.headers.set("Retry-After", String(err.retryAfterSeconds));
    return res;
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "اطلاعات ارسالی معتبر نیست.", fields }, meta: { requestId } },
      { status: 400 }
    );
  }
  console.error(JSON.stringify({ level: "error", requestId, err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err) }));
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید." }, meta: { requestId } },
    { status: 500 }
  );
}

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 1_000_000) throw new AppError("BAD_REQUEST", "حجم درخواست بیش از حد مجاز است.");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("BAD_REQUEST", "بدنه درخواست باید JSON معتبر باشد.");
  }
  return schema.parse(body);
}

function checkCsrf(req: NextRequest): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const cookie = req.cookies.get(CSRF_COOKIE)?.value;
  const header = req.headers.get(CSRF_HEADER);
  const valid =
    !!cookie && !!header && cookie.length === header.length && crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header));
  if (!valid) throw new AppError("FORBIDDEN", "درخواست نامعتبر است. صفحه را دوباره بارگذاری کنید.");
  const origin = req.headers.get("origin");
  const appUrl = env().APP_URL;
  if (origin && appUrl && new URL(appUrl).origin !== origin) {
    throw new AppError("FORBIDDEN", "درخواست از مبدأ نامعتبر.");
  }
}

async function authenticate(req: NextRequest): Promise<Auth> {
  const deps = coreDeps();
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const { user, session } = await authenticateAccessToken(deps, bearer.slice(7));
    return { user, session, via: "bearer" };
  }
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) throw new AppError("UNAUTHENTICATED", "ابتدا وارد حساب کاربری شوید.");
  checkCsrf(req);
  const { user, session } = await authenticateWebSession(deps, cookie);
  return { user, session, via: "cookie" };
}

async function run(req: NextRequest, routeCtx: { params?: Promise<Record<string, string>> } | undefined, fn: (base: ApiContext) => Promise<unknown>) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const started = Date.now();
  let status = 500;
  try {
    const base: ApiContext = {
      req,
      requestId,
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent"),
      params: (await routeCtx?.params) ?? {},
    };
    const result = await fn(base);
    const response = result instanceof Response ? result : ok(result ?? null, {}, requestId);
    status = response.status;
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (err) {
    const response = errorResponse(err, requestId);
    status = response.status;
    response.headers.set("x-request-id", requestId);
    return response;
  } finally {
    console.info(JSON.stringify({ level: "info", requestId, method: req.method, path: req.nextUrl.pathname, status, ms: Date.now() - started }));
  }
}

type RouteCtx = { params: Promise<Record<string, string>> };

/** Public endpoint. */
export function publicRoute(handler: Handler<object>) {
  return (req: NextRequest, routeCtx?: RouteCtx) => run(req, routeCtx, (base) => handler(base));
}

/** Requires a signed-in user (no gym context). */
export function userRoute(handler: Handler<{ auth: Auth }>) {
  return (req: NextRequest, routeCtx?: RouteCtx) =>
    run(req, routeCtx, async (base) => handler({ ...base, auth: await authenticate(req) }));
}

/** Requires a signed-in user with an active gym; builds the tenant context on the server. */
export function tenantRoute(handler: Handler<{ auth: Auth; tenant: TenantContext }>) {
  return (req: NextRequest, routeCtx?: RouteCtx) =>
    run(req, routeCtx, async (base) => {
      const auth = await authenticate(req);
      if (!auth.session.activeGymId) {
        throw new AppError("FORBIDDEN", "ابتدا باشگاه مورد نظر را انتخاب کنید.");
      }
      const tenant = await loadTenantContext(coreDeps().db, auth.user.id, auth.session.activeGymId, {
        ip: base.ip,
        userAgent: base.userAgent,
      });
      return handler({ ...base, auth, tenant });
    });
}

const SESSION_MAX_AGE = 30 * 24 * 3600;

/** Sets the HttpOnly session cookie and a readable CSRF cookie (double-submit pattern). */
export function setWebSessionCookies(res: NextResponse, token: string): void {
  const secure = env().NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  res.cookies.set(CSRF_COOKIE, crypto.randomBytes(24).toString("base64url"), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearWebSessionCookies(res: NextResponse): void {
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(CSRF_COOKIE);
}

export function isMobileClient(req: NextRequest): boolean {
  return req.headers.get("x-client") === "mobile";
}
