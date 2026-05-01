import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, users, workProducts, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/admin/worker-productions — list all worker productions with user info (admin only)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: workerProductions.id,
      units: workerProductions.units,
      status: workerProductions.status,
      createdAt: workerProductions.createdAt,
      workProductName: workProducts.name,
      categoryName: categories.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(workerProductions)
    .innerJoin(users, eq(workerProductions.userId, users.id))
    .innerJoin(workProducts, eq(workerProductions.workProductId, workProducts.id))
    .innerJoin(categories, eq(workProducts.categoryId, categories.id))
    .orderBy(workerProductions.createdAt);

  return NextResponse.json(rows);
}
