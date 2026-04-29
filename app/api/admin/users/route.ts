import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

// POST /api/admin/users — create a new user
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "editor", "admin"]).default("user"),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password, role } = result.data;

  // Use better-auth to create the user (handles password hashing + account row)
  const signUpRes = await auth.api.signUpEmail({
    body: { name, email, password },
    asResponse: true,
  });

  if (!signUpRes.ok) {
    const err = await signUpRes.json().catch(() => ({ error: "Failed to create user" }));
    return NextResponse.json(err, { status: signUpRes.status });
  }

  const created = await signUpRes.json();
  const userId: string = created?.user?.id ?? created?.id;

  // Set role if not default
  if (role !== "user") {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  const [newUser] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId));

  return NextResponse.json(newUser, { status: 201 });
}

// GET /api/admin/users
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);

  return NextResponse.json(allUsers);
}

// PATCH /api/admin/users — update a user's role
const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["user", "editor", "admin"]),
});

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const result = updateRoleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ role: result.data.role, updatedAt: new Date() })
    .where(eq(users.id, result.data.userId))
    .returning({ id: users.id, role: users.role });

  return NextResponse.json(updated);
}
