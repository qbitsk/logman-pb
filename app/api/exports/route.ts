import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workProducts, workStations, workSubmissionDefects, workComponents, workDefects } from "@/lib/db/schema";
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
      workProductName: workProducts.name,
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
    .leftJoin(workProducts, eq(submissions.workProductId, workProducts.id))
    .leftJoin(workStations, eq(submissions.workStationId, workStations.id))
    .orderBy(submissions.createdAt);

  const typedRows = rows.map((r) => ({
    ...r,
    workProductName: r.workProductName ?? "Unknown",
    workStationName: r.workStationName ?? "",
    userName: r.userName ?? "Unknown",
  }));

  // Fetch all defects with component and defect category names
  const defectRows = await db
    .select({
      submissionId: workSubmissionDefects.submissionId,
      componentName: workComponents.name,
      defectCategoryName: workProducts.name,
      units: workSubmissionDefects.units,
    })
    .from(workSubmissionDefects)
    .leftJoin(workDefects, eq(workSubmissionDefects.workDefectId, workDefects.id))
    .leftJoin(workComponents, eq(workDefects.workComponentId, workComponents.id))
    .leftJoin(workProducts, eq(workDefects.workProductId, workProducts.id));

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
