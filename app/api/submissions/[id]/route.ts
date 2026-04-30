import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, workComponentDefects, workComponents, workComponentDefectCategories, workCategories, workStations, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { workComponentDefectSchema } from "@/lib/validations/submission";

const patchSchema = z.object({
  workCategoryId: z.string().min(1).optional(),
  workStationId: z.string().optional().nullable(),
  units: z.number().int().positive().optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  workComponentDefects: z.array(workComponentDefectSchema).optional(),
});

// GET /api/submissions/[id] — fetch a single submission owned by the current user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      userName: users.name,
      userEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [existingDefects, defectsDisplay, categoryRow, stationRow] = await Promise.all([
    db
      .select({
        workComponentId: workComponentDefects.workComponentId,
        workComponentDefectCategoryId: workComponentDefects.workComponentDefectCategoryId,
        units: workComponentDefects.units,
      })
      .from(workComponentDefects)
      .where(eq(workComponentDefects.submissionId, id)),
    db
      .select({
        workComponentName: workComponents.name,
        defectCategoryName: workComponentDefectCategories.name,
        units: workComponentDefects.units,
      })
      .from(workComponentDefects)
      .innerJoin(workComponents, eq(workComponentDefects.workComponentId, workComponents.id))
      .innerJoin(workComponentDefectCategories, eq(workComponentDefects.workComponentDefectCategoryId, workComponentDefectCategories.id))
      .where(eq(workComponentDefects.submissionId, id)),
    db.select({ name: workCategories.name }).from(workCategories).where(eq(workCategories.id, row.workCategoryId)).limit(1),
    row.workStationId
      ? db.select({ name: workStations.name }).from(workStations).where(eq(workStations.id, row.workStationId)).limit(1)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ...row,
    categoryName: categoryRow[0]?.name ?? null,
    stationName: stationRow[0]?.name ?? null,
    existingDefects,
    defects: defectsDisplay,
  });
}

// PATCH /api/submissions/[id] — update a submission owned by the current user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Only allow edits when submission is in draft or submitted state
  const [existing] = await db
    .select({ status: submissions.status })
    .from(submissions)
    .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft" && existing.status !== "submitted") {
    return NextResponse.json({ error: "Submission cannot be edited in its current status" }, { status: 403 });
  }

  const [updated] = await db
    .update(submissions)
    .set({ ...submissionData, updatedAt: new Date() })
    .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

// DELETE /api/submissions/[id] — delete a submission owned by the current user (draft or submitted only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ status: submissions.status })
    .from(submissions)
    .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft" && existing.status !== "submitted") {
    return NextResponse.json({ error: "Submission cannot be deleted in its current status" }, { status: 403 });
  }

  await db.delete(submissions).where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
