import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS for the token-based (mobile) API only. Cookies are never allowed cross-origin (no Allow-Credentials),
 * so a foreign page cannot use a browser session. Allowed: CORS_ORIGINS (comma separated) and, outside
 * production, the Expo web preview on port 8081/19006.
 */
function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const list = (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.includes(origin)) return origin;
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_CONSOLE_SMS === "true") {
    try {
      const u = new URL(origin);
      if (u.protocol === "http:" && (u.port === "8081" || u.port === "19006")) return origin;
    } catch { /* ignore */ }
  }
  return null;
}

function withCors(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "authorization,content-type,x-client");
  res.headers.set("Access-Control-Max-Age", "600");
  return res;
}

/** Sends signed-out visitors of app pages to /login. The API still checks every request itself. */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/")) {
    const origin = allowedOrigin(req.headers.get("origin"));
    if (!origin) return NextResponse.next();
    if (req.method === "OPTIONS") return withCors(new NextResponse(null, { status: 204 }), origin);
    return withCors(NextResponse.next(), origin);
  }
  if (path === "/admin/login") return NextResponse.next();
  if (!req.cookies.has("sg_session")) {
    const url = req.nextUrl.clone();
    url.pathname = path.startsWith("/admin") ? "/admin/login" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/manager/:path*", "/onboarding", "/select-gym", "/athlete/:path*", "/athlete", "/admin/:path*", "/admin"] };
