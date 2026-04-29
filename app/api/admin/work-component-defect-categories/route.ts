import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workComponentDefectCategories, workComponents, workCategories } from "@/lib/db/schema";
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
  workComponentId: z.string().min(1),
});

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: workComponentDefectCategories.id,
      name: workComponentDefectCategories.name,
      workComponentId: workComponentDefectCategories.workComponentId,
      componentName: workComponents.name,
      categoryName: workCategories.name,
      createdAt: workComponentDefectCategories.createdAt,
      updatedAt: workComponentDefectCategories.updatedAt,
    })
    .from(workComponentDefectCategories)
    .innerJoin(workComponents, eq(workComponentDefectCategories.workComponentId, workComponents.id))
    .innerJoin(workCategories, eq(workComponents.workCategoryId, workCategories.id))
    .orderBy(workCategories.name, workComponents.name, workComponentDefectCategories.name);

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
    .insert(workComponentDefectCategories)
    .values({ name: result.data.name, workComponentId: result.data.workComponentId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
