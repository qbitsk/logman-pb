import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, categories, workStations, workDefects, workComponents } from "@/lib/db/schema";
import { generateSubmissionsCSV } from "@/lib/exports/excel";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/exports?format=csv
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Join submissions with user, category and station data
  const rows = await db
    .select({
      id: submissions.id,
      workCategoryName: categories.name,
      workStationName: workStations.name,
      units: submissions.units,
      shift: submissions.shift,
      notes: submissions.notes,
      status: submissions.status,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      userId: submissions.userId,
      userName: users.name,
    })
    .from(submissions)
    .leftJoin(users, eq(submissions.userId, users.id))
    .leftJoin(categories, eq(submissions.workCategoryId, categories.id))
    .leftJoin(workStations, eq(submissions.workStationId, workStations.id))
    .orderBy(submissions.createdAt);

  const typedRows = rows.map((r) => ({
    ...r,
    workCategoryName: r.workCategoryName ?? "Unknown",
    workStationName: r.workStationName ?? "",
    userName: r.userName ?? "Unknown",
  }));

  // Fetch all defects with component and defect category names
  const defectRows = await db
    .select({
      submissionId: workDefects.submissionId,
      componentName: workComponents.name,
      defectCategoryName: categories.name,
      units: workDefects.units,
    })
    .from(workDefects)
    .leftJoin(workComponents, eq(workDefects.workComponentId, workComponents.id))
    .leftJoin(categories, eq(workDefects.categoryId, categories.id));

  const typedDefectRows = defectRows.map((d) => ({
    submissionId: d.submissionId,
    componentName: d.componentName ?? "Unknown",
    defectCategoryName: d.defectCategoryName ?? "Unknown",
    units: d.units,
  }));

  const csv = await generateSubmissionsCSV(typedRows, typedDefectRows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="submissions-${Date.now()}.csv"`,
    },
  });
}
