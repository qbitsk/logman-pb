// Maps route path prefixes to the minimum required role.
// Middleware reads this to make access control decisions.

export type Role = "user" | "operator" | "admin";

// Role hierarchy: admin > operator > user
const roleRank: Record<Role, number> = {
  user: 1,
  operator: 2,
  admin: 3,
};

export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return roleRank[userRole] >= roleRank[requiredRole];
}

// Routes that require at least this role to access
export const routePermissions: Array<{ prefix: string; role: Role }> = [
  // Operator-accessible admin routes (must come before the general /admin entry)
  { prefix: "/admin/worker-productions", role: "operator" },
  { prefix: "/api/admin/worker-productions", role: "operator" },
  // Admin-only routes
  { prefix: "/admin", role: "admin" },
  { prefix: "/api/admin", role: "admin" },
  { prefix: "/api/exports", role: "operator" },
  { prefix: "/dashboard", role: "user" },
  { prefix: "/worker-productions", role: "user" },
  { prefix: "/profile", role: "user" },
];

// Routes that are always public (no auth required)
export const publicRoutes = [
  "/login",
  "/register",
  "/api/auth",
];
