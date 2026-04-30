import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, workComponentDefects, workCategories } from "@/lib/db/schema";
import { submissionSchema } from "@/lib/validations/submission";
import { sendSubmissionConfirmation, sendAdminNotification } from "@/lib/mail";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/submissions — list submissions for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSubmissions = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      units: submissions.units,
      createdAt: submissions.createdAt,
      categoryName: workCategories.name,
    })
    .from(submissions)
    .innerJoin(workCategories, eq(submissions.workCategoryId, workCategories.id))
    .where(eq(submissions.userId, session.user.id))
    .orderBy(submissions.createdAt);

  return NextResponse.json(userSubmissions);
}

// POST /api/submissions — create a new submission
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = submissionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const [submission] = await db
    .insert(submissions)
    .values({
      workCategoryId: result.data.workCategoryId,
      workStationId: result.data.workStationId ?? null,
      units: result.data.units ?? null,
      shift: result.data.shift ?? null,
      notes: result.data.notes,
      userId: session.user.id,
      status: "submitted",
    })
    .returning();

  if (result.data.workComponentDefects?.length) {
    await db.insert(workComponentDefects).values(
      result.data.workComponentDefects.map((d) => ({
        submissionId: submission.id,
        workComponentId: d.workComponentId,
        workComponentDefectCategoryId: d.workComponentDefectCategoryId,
        units: d.units,
      }))
    );
  }

  // Fire emails (non-blocking — don't await in critical path)
  Promise.all([
    sendSubmissionConfirmation({
      user: { name: session.user.name, email: session.user.email },
      submissionId: submission.id,
    }),
    // Replace with your actual admin email or fetch from DB
    sendAdminNotification({
      adminEmail: process.env.ADMIN_EMAIL ?? "admin@yourdomain.com",
      submitterName: session.user.name,
      submissionId: submission.id,
    }),
  ]).catch(console.error);

  return NextResponse.json(submission, { status: 201 });
}
