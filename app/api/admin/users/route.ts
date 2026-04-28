import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

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
