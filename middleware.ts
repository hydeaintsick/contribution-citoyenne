import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "./lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin/login") {
      loginUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const isAccountManagerRestrictedRoute = pathname.startsWith("/admin/account-managers");
  const isAdmin = session.user.role === "ADMIN";
  const isAccountManager = session.user.role === "ACCOUNT_MANAGER";

  if (
    (!isAdmin && !isAccountManager) ||
    (isAccountManager && isAccountManagerRestrictedRoute)
  ) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin/login") {
      loginUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

