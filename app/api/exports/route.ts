import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { generateSubmissionsExcel, generateSubmissionsCSV } from "@/lib/exports/excel";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/exports?format=csv|xlsx
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role === "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "xlsx";

  // Join submissions with user data
  const rows = await db
    .select({
      id: submissions.id,
      title: submissions.title,
      description: submissions.description,
      category: submissions.category,
      notes: submissions.notes,
      status: submissions.status,
      createdAt: submissions.createdAt,
      updatedAt: submissions.updatedAt,
      userId: submissions.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(submissions)
    .leftJoin(users, eq(submissions.userId, users.id))
    .orderBy(submissions.createdAt);

  const typedRows = rows.map((r) => ({
    ...r,
    userName: r.userName ?? "Unknown",
    userEmail: r.userEmail ?? "Unknown",
  }));

  if (format === "csv") {
    const csv = await generateSubmissionsCSV(typedRows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-${Date.now()}.csv"`,
      },
    });
  }

  const buffer = await generateSubmissionsExcel(typedRows);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="submissions-${Date.now()}.xlsx"`,
    },
  });
}
