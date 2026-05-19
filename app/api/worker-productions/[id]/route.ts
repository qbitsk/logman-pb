import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, workerProductionDefects, productionDefects, productionComponents, productionProducts, productionStations, users, productionProcesses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { workerProductionDefectSchema } from "@/lib/validations/worker-production";

const patchSchema = z.object({
  productionProductId: z.string().min(1).optional(),
  productionStationId: z.string().optional().nullable(),
  units: z.number().int().positive().optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  workerProductionDefects: z.array(workerProductionDefectSchema).optional(),
});

// GET /api/worker-productions/[id] — fetch a single worker production owned by the current user
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
      id: workerProductions.id,
      productionProductId: workerProductions.productionProductId,
      productionStationId: workerProductions.productionStationId,
      units: workerProductions.units,
      shift: workerProductions.shift,
      notes: workerProductions.notes,
      status: workerProductions.status,
      createdAt: workerProductions.createdAt,
      updatedAt: workerProductions.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(workerProductions)
    .innerJoin(users, eq(workerProductions.userId, users.id))
    .where(and(eq(workerProductions.id, id), eq(workerProductions.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [existingDefects, defectsDisplay, categoryRow, stationRow] = await Promise.all([
    db
      .select({
        productionDefectId: workerProductionDefects.productionDefectId,
        units: workerProductionDefects.units,
      })
      .from(workerProductionDefects)
      .where(eq(workerProductionDefects.workerProductionId, id)),
    db
      .select({
        workDefectName: productionDefects.name,
        workDefectType: productionDefects.type,
        workComponentName: productionComponents.name,
        units: workerProductionDefects.units,
      })
      .from(workerProductionDefects)
      .innerJoin(productionDefects, eq(workerProductionDefects.productionDefectId, productionDefects.id))
      .leftJoin(productionComponents, eq(productionDefects.productionComponentId, productionComponents.id))
      .where(eq(workerProductionDefects.workerProductionId, id)),
    db.select({ name: productionProducts.name, productionProcessName: productionProcesses.name }).from(productionProducts).innerJoin(productionProcesses, eq(productionProducts.productionProcessId, productionProcesses.id)).where(eq(productionProducts.id, row.productionProductId)).limit(1),
    row.productionStationId
      ? db.select({ name: productionStations.name }).from(productionStations).where(eq(productionStations.id, row.productionStationId)).limit(1)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ...row,
    workProductName: categoryRow[0]?.name ?? null,
    productionProcessName: categoryRow[0]?.productionProcessName ?? null,
    stationName: stationRow[0]?.name ?? null,
    existingDefects,
    defects: defectsDisplay,
  });
}

// PATCH /api/worker-productions/[id] — update a worker production owned by the current user
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

  const { workerProductionDefects: defectsPayload, ...productionData } = result.data;

  // Only allow edits when production is in new state
  const [existing] = await db
    .select({ status: workerProductions.status })
    .from(workerProductions)
    .where(and(eq(workerProductions.id, id), eq(workerProductions.userId, session.user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "new") {
    return NextResponse.json({ error: "Worker production cannot be edited in its current status" }, { status: 403 });
  }

  const [updated] = await db
    .update(workerProductions)
    .set({ ...productionData, updatedAt: new Date() })
    .where(and(eq(workerProductions.id, id), eq(workerProductions.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(workerProductionDefects).where(eq(workerProductionDefects.workerProductionId, id));
  if (defectsPayload?.length) {
    await db.insert(workerProductionDefects).values(
      defectsPayload.map((d) => ({
        workerProductionId: id,
        productionDefectId: d.productionDefectId,
        units: d.units,
      }))
    );
  }

  return NextResponse.json(updated);
}

// DELETE /api/worker-productions/[id] — delete a worker production owned by the current user (new only)
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
    .select({ status: workerProductions.status })
    .from(workerProductions)
    .where(and(eq(workerProductions.id, id), eq(workerProductions.userId, session.user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "new") {
    return NextResponse.json({ error: "Worker production cannot be deleted in its current status" }, { status: 403 });
  }

  await db.delete(workerProductions).where(and(eq(workerProductions.id, id), eq(workerProductions.userId, session.user.id)));

  return new NextResponse(null, { status: 204 });
}
