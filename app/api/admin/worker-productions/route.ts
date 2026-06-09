import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, workerProductionDefects, productionDefects, users, productionParts, productionProcesses, productionStations, getWorkerProductionStatus } from "@/lib/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/admin/worker-productions — list all worker productions with user info (admin/operator)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(["admin", "operator"] as string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: workerProductions.id,
      units: workerProductions.units,
      shift: workerProductions.shift,
      createdAt: workerProductions.createdAt,
      productionPartName: productionParts.name,
      productionPartNumber: productionParts.number,
      productionProcessName: productionProcesses.name,
      stationName: productionStations.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(workerProductions)
    .innerJoin(users, eq(workerProductions.userId, users.id))
    .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
    .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
    .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
    .orderBy(desc(workerProductions.createdAt));

  const ids = rows.map((r) => r.id);
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
    rows.map((r) => ({
      ...r,
      status: getWorkerProductionStatus(r.createdAt),
      defectedProducts: defectMap.get(r.id)?.defectedProducts ?? 0,
      defectedComponents: defectMap.get(r.id)?.defectedComponents ?? 0,
    }))
  );
}
