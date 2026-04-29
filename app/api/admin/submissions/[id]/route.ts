import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workComponentDefects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { workComponentDefectSchema } from "@/lib/validations/submission";

const patchSchema = z.object({
  workCategoryId: z.string().min(1).optional(),
  workStationId: z.string().optional().nullable(),
  units: z.number().int().positive().optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "submitted", "approved", "rejected"]).optional(),
  workComponentDefects: z.array(workComponentDefectSchema).optional(),
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
      workCategoryId: submissions.workCategoryId,
      workStationId: submissions.workStationId,
      units: submissions.units,
      shift: submissions.shift,
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

  const { workComponentDefects: defectsPayload, ...submissionData } = result.data;

  const [updated] = await db
    .update(submissions)
    .set({ ...submissionData, updatedAt: new Date() })
    .where(eq(submissions.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Replace defects: delete existing, insert new
  await db.delete(workComponentDefects).where(eq(workComponentDefects.submissionId, id));
  if (defectsPayload?.length) {
    await db.insert(workComponentDefects).values(
      defectsPayload.map((d) => ({
        submissionId: id,
        workComponentId: d.workComponentId,
        workComponentDefectCategoryId: d.workComponentDefectCategoryId,
        units: d.units,
      }))
    );
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/submissions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(submissions).where(eq(submissions.id, id));

  return new NextResponse(null, { status: 204 });
}
