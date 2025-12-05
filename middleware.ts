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

  const role = session.user.role;

  if (role === "ADMIN") {
    return NextResponse.next();
  }

  if (role === "ACCOUNT_MANAGER") {
    // Routes interdites pour ACCOUNT_MANAGER
    const restrictedRoutes = [
      "/admin/account-managers",
      "/admin/news",
      "/admin/retours-produits",
      "/admin/contact-tickets",
      "/admin/activite",
      "/admin/configuration",
    ];
    
    const isRestricted = restrictedRoutes.some((route) =>
      pathname.startsWith(route)
    );
    
    if (isRestricted) {
      const redirectUrl = new URL("/admin", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    return NextResponse.next();
  }

  if (role === "TOWN_MANAGER" || role === "TOWN_EMPLOYEE") {
    const exactAllowed = new Set([
      "/admin",
      "/admin/",
      "/admin/dashboard",
      "/admin/profile",
      "/admin/kit-media",
      "/admin/configuration-ville",
      "/admin/api",
    ]);
    const prefixAllowed = ["/admin/retours", "/admin/developpeurs"];

    if (role === "TOWN_MANAGER") {
      exactAllowed.add("/admin/acces-salaries");
      prefixAllowed.push("/admin/acces-salaries");
    }

    const isAllowed =
      exactAllowed.has(pathname) ||
      prefixAllowed.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

    if (!isAllowed) {
      const redirectUrl = new URL("/admin", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Note: La vérification de l'accès premium est faite dans les pages /admin/developpeurs/*
    // car le middleware Edge ne peut pas utiliser Prisma directement

    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname !== "/admin/login") {
    loginUrl.searchParams.set("redirectTo", pathname);
  }
  return NextResponse.redirect(loginUrl);

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
