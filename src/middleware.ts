import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
  sanitizeCallbackUrl,
} from "@/server/security/cookie";

/**
 * VOIDTECH SOLUTION — Edge Route Protection Middleware
 *
 * Operational Model:
 * 1. Edge-compatible first line of defense: verifies cryptographically signed session cookie
 *    (HMAC-SHA256) with zero database overhead.
 * 2. Unauthenticated UI visitors to /admin/* are redirected to /admin/login?callbackUrl=...
 * 3. Unauthenticated API callers to /api/admin/* receive HTTP 401 Unauthorized.
 * 4. Authenticated sessions visiting /admin/login are redirected to their destination or /admin.
 * 5. Applies baseline HTTP security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
 *
 * Security Boundary:
 * Middleware is an early edge rejection filter only. All Server Components, Server Actions,
 * and API route handlers independently verify PostgreSQL session state and enforce granular RBAC.
 */

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authSecret =
    process.env.AUTH_SECRET ||
    "default_auth_secret_minimum_32_characters_long_for_security";

  const sessionPayload = cookieValue
    ? await verifySessionCookie(cookieValue, authSecret)
    : null;

  const isAuthenticated = Boolean(sessionPayload);

  // 1. Handling /admin/login
  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      const rawCallback = request.nextUrl.searchParams.get("callbackUrl");
      const safeCallback = sanitizeCallbackUrl(rawCallback, "/admin");
      const finalTarget =
        safeCallback === "/admin/login" ? "/admin" : safeCallback;
      const targetUrl = new URL(finalTarget, request.url);
      return NextResponse.redirect(targetUrl);
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 2. Handling protected /api/admin/* API routes
  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: "Unauthorized: Valid administrative session required",
          code: "UNAUTHORIZED_ADMIN_SESSION",
        },
        { status: 401 }
      );
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // 3. Handling protected /admin/* UI routes
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const fullPath = pathname + search;
      const safeCallback = sanitizeCallbackUrl(fullPath, "/admin");
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", safeCallback);
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

