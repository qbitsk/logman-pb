// Maps route path prefixes to the minimum required role.
// Middleware reads this to make access control decisions.

// Keep in sync with the `role` enum in lib/db/schema/users.ts.
export const roles = ["operator", "supervisor", "admin"] as const;

export type Role = (typeof roles)[number];

export const defaultRole: Role = "operator";

// Role hierarchy: admin > supervisor > operator
const roleRank: Record<Role, number> = {
  operator: 1,
  supervisor: 2,
  admin: 3,
};

// Takes a plain string because session roles are untyped. An unknown role has
// no rank, so it is denied everything.
export function hasRequiredRole(userRole: string, requiredRole: Role): boolean {
  return roleRank[userRole as Role] >= roleRank[requiredRole];
}

// Routes that require at least this role to access
export const routePermissions: Array<{ prefix: string; role: Role }> = [
  // Supervisor-accessible admin routes (must come before the general /admin entry)
  { prefix: "/admin/worker-productions", role: "supervisor" },
  { prefix: "/api/admin/worker-productions", role: "supervisor" },
  { prefix: "/admin/analytics", role: "supervisor" },
  { prefix: "/api/admin/analytics", role: "supervisor" },
  // Admin-only routes
  { prefix: "/admin", role: "admin" },
  { prefix: "/api/admin", role: "admin" },
  { prefix: "/api/exports", role: "supervisor" },
  { prefix: "/dashboard", role: "operator" },
  { prefix: "/worker-productions", role: "operator" },
  { prefix: "/profile", role: "operator" },
];

// Routes that are always public (no auth required)
export const publicRoutes = [
  "/login",
  "/register",
  "/api/auth",
];
