import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.enum(["general", "technical", "financial", "hr", "other"]).optional(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "submitted", "reviewed", "approved", "rejected"]).optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// GET /api/admin/submissions/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [row] = await db
    .select({
      id: submissions.id,
      title: submissions.title,
      description: submissions.description,
      category: submissions.category,
      notes: submissions.notes,
      status: submissions.status,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      userId: submissions.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(eq(submissions.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

// PATCH /api/admin/submissions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = patchSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(submissions)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(submissions.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}
