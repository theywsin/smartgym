import { NextResponse, type NextRequest } from "next/server";

/** Sends signed-out visitors of app pages to /login. The API still checks every request itself. */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/admin/login") return NextResponse.next();
  if (!req.cookies.has("sg_session")) {
    const url = req.nextUrl.clone();
    url.pathname = path.startsWith("/admin") ? "/admin/login" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/manager/:path*", "/onboarding", "/select-gym", "/athlete/:path*", "/athlete", "/admin/:path*", "/admin"] };
