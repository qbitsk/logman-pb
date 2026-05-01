// Maps route path prefixes to the minimum required role.
// Middleware reads this to make access control decisions.

export type Role = "user" | "editor" | "admin";

// Role hierarchy: admin > editor > user
const roleRank: Record<Role, number> = {
  user: 1,
  editor: 2,
  admin: 3,
};

export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  return roleRank[userRole] >= roleRank[requiredRole];
}

// Routes that require at least this role to access
export const routePermissions: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/api/admin", role: "admin" },
  { prefix: "/api/exports", role: "editor" },
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
