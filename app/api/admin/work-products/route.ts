import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workProducts, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

const bodySchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
});

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: workProducts.id,
      name: workProducts.name,
      categoryId: workProducts.categoryId,
      categoryName: categories.name,
      createdAt: workProducts.createdAt,
      updatedAt: workProducts.updatedAt,
    })
    .from(workProducts)
    .innerJoin(categories, eq(workProducts.categoryId, categories.id))
    .orderBy(categories.name, workProducts.name);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const result = bodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [created] = await db
    .insert(workProducts)
    .values({ name: result.data.name, categoryId: result.data.categoryId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
