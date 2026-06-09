import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, workerProductionDefects, productionDefects, productionParts, productionProcesses, productionStations, getWorkerProductionStatus } from "@/lib/db/schema";
import { workerProductionSchema } from "@/lib/validations/worker-production";
import { sendSubmissionConfirmation, sendAdminNotification } from "@/lib/mail";
import { desc, eq, inArray, sql } from "drizzle-orm";
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
      units: workerProductions.units,
      shift: workerProductions.shift,
      createdAt: workerProductions.createdAt,
      productionPartName: productionParts.name,
      productionPartNumber: productionParts.number,
      productionProcessName: productionProcesses.name,
      stationName: productionStations.name,
    })
    .from(workerProductions)
    .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
    .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
    .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
    .where(eq(workerProductions.userId, session.user.id))
    .orderBy(desc(workerProductions.createdAt));

  const ids = userProductions.map((p) => p.id);
  const defectTotals = ids.length
    ? await db
        .select({
          workerProductionId: workerProductionDefects.workerProductionId,
          type: productionDefects.type,
          total: sql<number>`cast(sum(${workerProductionDefects.units}) as int)`.as("total"),
        })
        .from(workerProductionDefects)
        .innerJoin(productionDefects, eq(workerProductionDefects.productionDefectId, productionDefects.id))
        .where(inArray(workerProductionDefects.workerProductionId, ids))
        .groupBy(workerProductionDefects.workerProductionId, productionDefects.type)
    : [];

  const defectMap = new Map<string, { defectedProducts: number; defectedComponents: number }>();
  for (const row of defectTotals) {
    const entry = defectMap.get(row.workerProductionId) ?? { defectedProducts: 0, defectedComponents: 0 };
    if (row.type === "unit") entry.defectedProducts = row.total;
    else if (row.type === "component") entry.defectedComponents = row.total;
    defectMap.set(row.workerProductionId, entry);
  }

  return NextResponse.json(
    userProductions.map((p) => ({
      ...p,
      status: getWorkerProductionStatus(p.createdAt),
      defectedProducts: defectMap.get(p.id)?.defectedProducts ?? 0,
      defectedComponents: defectMap.get(p.id)?.defectedComponents ?? 0,
    }))
  );
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
      productionPartId: result.data.productionPartId,
      productionStationId: result.data.productionStationId ?? null,
      units: result.data.units ?? null,
      shift: result.data.shift ?? null,
      notes: result.data.notes,
      userId: session.user.id,
    })
    .returning();

  if (result.data.workerProductionDefects?.length) {
    await db.insert(workerProductionDefects).values(
      result.data.workerProductionDefects.map((d) => ({
        workerProductionId: production.id,
        productionDefectId: d.productionDefectId,
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
