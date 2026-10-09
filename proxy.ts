import { NextRequest, NextResponse } from "next/server";
import { publicRoutes, routePermissions, hasRequiredRole, type Role } from "@/lib/auth/permissions";

// Absolute URL on the host the browser actually used. Behind a reverse proxy
// (nginx, Vercel) request.url carries the upstream address (e.g. 127.0.0.1:3000),
// so prefer the X-Forwarded-* headers the proxy sets.
function publicUrl(request: NextRequest, path: string) {
  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0];
  return new URL(path, host ? `${proto ?? "http"}://${host}` : request.url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Read the session token from cookie.
  // On HTTPS (Vercel) better-auth prefixes cookie names with "__Secure-".
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ??
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    // No session — redirect to login
    console.error("No session token found in cookies");

    const loginUrl = publicUrl(request, "/login");
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the session by calling our own auth endpoint
  // This is lightweight — Better Auth verifies the JWT signature at the edge
  // When self-hosted behind nginx, INTERNAL_APP_URL (e.g. http://127.0.0.1:3000)
  // keeps this call on the loopback instead of going out via the public hostname.
  const sessionRes = await fetch(
    new URL("/api/auth/get-session", process.env.INTERNAL_APP_URL ?? request.nextUrl.origin),
    {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    }
  );

  if (!sessionRes.ok) {
    console.error("Failed to validate session token");

    const loginUrl = publicUrl(request, "/login");
    return NextResponse.redirect(loginUrl);
  }

  const sessionData = await sessionRes.json();

  // Session token present but expired/invalid on the server side
  if (!sessionData?.user) {
    console.error("Session token expired or invalid");
    const loginUrl = publicUrl(request, "/login");
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (sessionData.user.role ?? "user") as Role;

  // Check route-level role requirements
  const matchedRoute = routePermissions.find((r) =>
    pathname.startsWith(r.prefix)
  );

  if (matchedRoute && !hasRequiredRole(userRole, matchedRoute.role)) {
    // Authenticated but wrong role
    return NextResponse.redirect(publicUrl(request, "/unauthorized"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
