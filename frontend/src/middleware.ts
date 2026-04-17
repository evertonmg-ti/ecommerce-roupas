import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_ROLE_COOKIE, ADMIN_TOKEN_COOKIE } from "./lib/auth-constants";

function getBaseUrl(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? request.headers.get("host") ?? "localhost:3000";
  const proto = forwardedProto ?? "http";

  return `${proto}://${host}`;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ADMIN_ROLE_COOKIE)?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");
  const baseUrl = getBaseUrl(request);

  if (isAdminRoute && (!token || role !== "ADMIN")) {
    const url = new URL("/login", baseUrl);
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && token && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", baseUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"]
};

