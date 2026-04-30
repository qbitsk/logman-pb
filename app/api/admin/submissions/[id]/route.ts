import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workSubmissionDefects, workDefects, workComponents, categories, workStations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { workSubmissionDefectSchema } from "@/lib/validations/submission";

const patchSchema = z.object({
  workCategoryId: z.string().min(1).optional(),
  workStationId: z.string().optional().nullable(),
  units: z.number().int().positive().optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "submitted", "approved", "rejected"]).optional(),
  workSubmissionDefects: z.array(workSubmissionDefectSchema).optional(),
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

  const [existingDefects, defectsDisplay, categoryRow, stationRow] = await Promise.all([
    db
      .select({
        workDefectId: workSubmissionDefects.workDefectId,
        units: workSubmissionDefects.units,
      })
      .from(workSubmissionDefects)
      .where(eq(workSubmissionDefects.submissionId, id)),
    db
      .select({
        workDefectName: workDefects.name,
        workComponentName: workComponents.name,
        units: workSubmissionDefects.units,
      })
      .from(workSubmissionDefects)
      .innerJoin(workDefects, eq(workSubmissionDefects.workDefectId, workDefects.id))
      .leftJoin(workComponents, eq(workDefects.workComponentId, workComponents.id))
      .where(eq(workSubmissionDefects.submissionId, id)),
    db.select({ name: categories.name }).from(categories).where(eq(categories.id, row.workCategoryId)).limit(1),
    row.workStationId
      ? db.select({ name: workStations.name }).from(workStations).where(eq(workStations.id, row.workStationId)).limit(1)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ...row,
    categoryName: categoryRow[0]?.name ?? null,
    stationName: (stationRow as { name: string }[])[0]?.name ?? null,
    existingDefects,
    defects: defectsDisplay,
  });
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

  const { workSubmissionDefects: defectsPayload, ...submissionData } = result.data;

  const [updated] = await db
    .update(submissions)
    .set({ ...submissionData, updatedAt: new Date() })
    .where(eq(submissions.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(workSubmissionDefects).where(eq(workSubmissionDefects.submissionId, id));
  if (defectsPayload?.length) {
    await db.insert(workSubmissionDefects).values(
      defectsPayload.map((d) => ({
        submissionId: id,
        workDefectId: d.workDefectId,
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
