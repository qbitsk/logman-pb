import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, workComponentDefects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { workComponentDefectSchema } from "@/lib/validations/submission";

const patchSchema = z.object({
  workCategoryId: z.string().min(1).optional(),
  workStationId: z.string().optional().nullable(),
  units: z.number().int().positive().optional().nullable(),
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

  const [submission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
    .limit(1);

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(submission);
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
