import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workProducts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/admin/submissions — list all submissions with user info (admin only)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: submissions.id,
      units: submissions.units,
      status: submissions.status,
      createdAt: submissions.createdAt,
      workProductName: workProducts.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .innerJoin(workProducts, eq(submissions.workProductId, workProducts.id))
    .orderBy(submissions.createdAt);

  return NextResponse.json(rows);
}
