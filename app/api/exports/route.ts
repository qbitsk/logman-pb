import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, users, productionProducts, productionStations, workerProductionDefects, productionComponents, productionDefects } from "@/lib/db/schema";
import { generateSubmissionsCSV } from "@/lib/exports/excel";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/exports?format=csv
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Join worker productions with user, category and station data
  const rows = await db
    .select({
      id: workerProductions.id,
      workProductName: productionProducts.name,
      workStationName: productionStations.name,
      units: workerProductions.units,
      shift: workerProductions.shift,
      notes: workerProductions.notes,
      status: workerProductions.status,
      createdAt: workerProductions.createdAt,
      updatedAt: workerProductions.updatedAt,
      userId: workerProductions.userId,
      userName: users.name,
    })
    .from(workerProductions)
    .leftJoin(users, eq(workerProductions.userId, users.id))
    .leftJoin(productionProducts, eq(workerProductions.productionProductId, productionProducts.id))
    .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
    .orderBy(workerProductions.createdAt);

  const typedRows = rows.map((r) => ({
    ...r,
    workProductName: r.workProductName ?? "Unknown",
    workStationName: r.workStationName ?? "",
    userName: r.userName ?? "Unknown",
  }));

  // Fetch all defects with component name, defect name and type
  const defectRows = await db
    .select({
      submissionId: workerProductionDefects.workerProductionId,
      componentName: productionComponents.name,
      defectName: productionDefects.name,
      defectType: productionDefects.type,
      units: workerProductionDefects.units,
    })
    .from(workerProductionDefects)
    .leftJoin(productionDefects, eq(workerProductionDefects.productionDefectId, productionDefects.id))
    .leftJoin(productionComponents, eq(productionDefects.productionComponentId, productionComponents.id));

  const typedDefectRows = defectRows.map((d) => ({
    submissionId: d.submissionId,
    componentName: d.componentName ?? "Unknown",
    defectName: d.defectName ?? "Unknown",
    defectType: d.defectType ?? "unit",
    units: d.units,
  }));

  const csv = await generateSubmissionsCSV(typedRows, typedDefectRows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="worker-productions-${Date.now()}.csv"`,
    },
  });
}
