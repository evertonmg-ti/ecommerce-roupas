import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_ROLE_COOKIE, ADMIN_TOKEN_COOKIE } from "./lib/auth-constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ADMIN_ROLE_COOKIE)?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  if (isAdminRoute && (!token || role !== "ADMIN")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && token && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"]
};
