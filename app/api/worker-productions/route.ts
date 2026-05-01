import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, workerProductionDefects, workProducts, categories } from "@/lib/db/schema";
import { workerProductionSchema } from "@/lib/validations/worker-production";
import { sendSubmissionConfirmation, sendAdminNotification } from "@/lib/mail";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/worker-productions — list worker productions for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProductions = await db
    .select({
      id: workerProductions.id,
      status: workerProductions.status,
      units: workerProductions.units,
      createdAt: workerProductions.createdAt,
      workProductName: workProducts.name,
      categoryName: categories.name,
    })
    .from(workerProductions)
    .innerJoin(workProducts, eq(workerProductions.workProductId, workProducts.id))
    .innerJoin(categories, eq(workProducts.categoryId, categories.id))
    .where(eq(workerProductions.userId, session.user.id))
    .orderBy(workerProductions.createdAt);

  return NextResponse.json(userProductions);
}

// POST /api/worker-productions — create a new worker production
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = workerProductionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const [production] = await db
    .insert(workerProductions)
    .values({
      workProductId: result.data.workProductId,
      workStationId: result.data.workStationId ?? null,
      units: result.data.units ?? null,
      shift: result.data.shift ?? null,
      notes: result.data.notes,
      userId: session.user.id,
      status: "new",
    })
    .returning();

  if (result.data.workerProductionDefects?.length) {
    await db.insert(workerProductionDefects).values(
      result.data.workerProductionDefects.map((d) => ({
        workerProductionId: production.id,
        workDefectId: d.workDefectId,
        units: d.units,
      }))
    );
  }

  // Fire emails (non-blocking — don't await in critical path)
  Promise.all([
    sendSubmissionConfirmation({
      user: { name: session.user.name, email: session.user.email },
      submissionId: production.id,
    }),
    sendAdminNotification({
      adminEmail: process.env.ADMIN_EMAIL ?? "admin@yourdomain.com",
      submitterName: session.user.name,
      submissionId: production.id,
    }),
  ]).catch(console.error);

  return NextResponse.json(production, { status: 201 });
}
