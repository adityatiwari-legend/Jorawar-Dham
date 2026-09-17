import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders } from "@/lib/security/headers";

const ADMIN_SESSION_COOKIE = "jd_admin_session";
const LOCALES = ["hi", "en"];
const DEFAULT_LOCALE = "hi";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Pass-through for static files, media delivery, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/media") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Admin Route Protection
  if (pathname.startsWith("/admin")) {
    const hasAdminSession = req.cookies.has(ADMIN_SESSION_COOKIE);

    if (pathname === "/admin/login") {
      if (hasAdminSession) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    } else if (!hasAdminSession) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Apply security headers to admin responses
    const res = NextResponse.next();
    const securityHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(securityHeaders)) {
      res.headers.set(key, value);
    }
    return res;
  }

  // 3. API Routes Security Headers
  if (pathname.startsWith("/api")) {
    const res = NextResponse.next();
    const securityHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(securityHeaders)) {
      res.headers.set(key, value);
    }
    return res;
  }

  // 4. Public Locale Routing
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Check saved cookie preference or fallback to DEFAULT_LOCALE
    const savedLocale = req.cookies.get("app_locale")?.value;
    const targetLocale =
      savedLocale && LOCALES.includes(savedLocale) ? savedLocale : DEFAULT_LOCALE;

    const redirectUrl = new URL(
      `/${targetLocale}${pathname === "/" ? "" : pathname}`,
      req.url
    );
    redirectUrl.search = req.nextUrl.search;

    const res = NextResponse.redirect(redirectUrl);
    const securityHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(securityHeaders)) {
      res.headers.set(key, value);
    }
    return res;
  }

  // Attach security headers and proceed
  const res = NextResponse.next();
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.headers.set(key, value);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
