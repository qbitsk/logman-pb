import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, workerProductionDefects, productionDefects, users, productionParts, productionProcesses, productionStations, getWorkerProductionStatus } from "@/lib/db/schema";
import { parseWorkerProductionFilters, workerProductionFilterWhere } from "@/lib/worker-productions/filters";
import { eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

const PAGE_SIZES = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

const sortColumns = {
  date:    workerProductions.createdAt,
  status:  workerProductions.createdAt,
  product: productionParts.name,
  station: productionStations.name,
  shift:   workerProductions.shift,
  units:   workerProductions.units,
  user:    users.name,
} as const;

// GET /api/admin/worker-productions — paginated list of worker productions with user info (admin/operator)
// Query: page (1-based), pageSize (25|50|100), sort (date|status|product|station|shift|units|user), dir (asc|desc),
// plus the filters from parseWorkerProductionFilters (dateFrom, dateTo, process, product, station, status, user, partSearch).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(["admin", "operator"] as string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const pageSize = PAGE_SIZES.includes(Number(sp.get("pageSize"))) ? Number(sp.get("pageSize")) : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Math.floor(Number(sp.get("page"))) || 1);
  const sortColumn = sortColumns[sp.get("sort") as keyof typeof sortColumns] ?? workerProductions.createdAt;
  const sortDir = sp.get("dir") === "asc" ? sql`asc` : sql`desc`;
  const where = workerProductionFilterWhere(parseWorkerProductionFilters(sp));

  const [rows, [{ total }]] = await Promise.all([
    db
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
      .where(where)
      // Tie-breakers keep page boundaries stable when the sort column has duplicates
      .orderBy(
        sql`${sortColumn} ${sortDir} nulls last`,
        sql`${workerProductions.createdAt} desc`,
        sql`${workerProductions.id} desc`,
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(workerProductions)
      .innerJoin(users, eq(workerProductions.userId, users.id))
      .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
      .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
      .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
      .where(where),
  ]);

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

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      status: getWorkerProductionStatus(r.createdAt),
      defectedProducts: defectMap.get(r.id)?.defectedProducts ?? 0,
      defectedComponents: defectMap.get(r.id)?.defectedComponents ?? 0,
    })),
    total,
    page,
    pageSize,
  });
}
