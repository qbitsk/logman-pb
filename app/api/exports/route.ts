import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, users, workProducts, workStations, workerProductionDefects, workComponents, workDefects } from "@/lib/db/schema";
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
      workProductName: workProducts.name,
      workStationName: workStations.name,
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
    .leftJoin(workProducts, eq(workerProductions.workProductId, workProducts.id))
    .leftJoin(workStations, eq(workerProductions.workStationId, workStations.id))
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
      componentName: workComponents.name,
      defectName: workDefects.name,
      defectType: workDefects.type,
      units: workerProductionDefects.units,
    })
    .from(workerProductionDefects)
    .leftJoin(workDefects, eq(workerProductionDefects.workDefectId, workDefects.id))
    .leftJoin(workComponents, eq(workDefects.workComponentId, workComponents.id));

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
