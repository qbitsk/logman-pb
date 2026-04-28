import { NextRequest, NextResponse } from "next/server";
import { publicRoutes, routePermissions, hasRequiredRole, type Role } from "@/lib/auth/permissions";

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

  // Read the session token from cookie
  // Better Auth uses "better-auth.session_token" by default
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    // No session — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the session by calling our own auth endpoint
  // This is lightweight — Better Auth verifies the JWT signature at the edge
  const sessionRes = await fetch(
    new URL("/api/auth/get-session", request.url),
    {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    }
  );

  if (!sessionRes.ok) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const sessionData = await sessionRes.json();
  const userRole = (sessionData?.user?.role ?? "user") as Role;

  // Check route-level role requirements
  const matchedRoute = routePermissions.find((r) =>
    pathname.startsWith(r.prefix)
  );

  if (matchedRoute && !hasRequiredRole(userRole, matchedRoute.role)) {
    // Authenticated but wrong role
    return NextResponse.redirect(new URL("/unauthorized", request.url));
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
