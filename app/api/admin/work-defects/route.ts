import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workDefects, workComponents, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

const componentBodySchema = z.object({
  name: z.string().min(1),
  workComponentId: z.string().min(1),
});

const unitBodySchema = z.object({
  name: z.string().min(1),
  workCategoryId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") as "component" | "unit" | null;

  const componentRows = await db
    .select({
      id: workDefects.id,
      name: workDefects.name,
      type: workDefects.type,
      workCategoryId: workDefects.workCategoryId,
      workComponentId: workDefects.workComponentId,
      componentName: workComponents.name,
      categoryName: categories.name,
      createdAt: workDefects.createdAt,
      updatedAt: workDefects.updatedAt,
    })
    .from(workDefects)
    .leftJoin(workComponents, eq(workDefects.workComponentId, workComponents.id))
    .leftJoin(categories, eq(workDefects.workCategoryId, categories.id))
    .where(type ? eq(workDefects.type, type) : undefined)
    .orderBy(categories.name, workComponents.name, workDefects.name);

  return NextResponse.json(componentRows);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { type } = body;

  if (type === "unit") {
    const result = unitBodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const [created] = await db
      .insert(workDefects)
      .values({
        name: result.data.name,
        type: "unit",
        workCategoryId: result.data.workCategoryId,
        workComponentId: null,
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  }

  // default: component
  const result = componentBodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const component = await db
    .select({ workCategoryId: workComponents.workCategoryId })
    .from(workComponents)
    .where(eq(workComponents.id, result.data.workComponentId))
    .limit(1);

  if (!component[0]) {
    return NextResponse.json({ error: "Component not found" }, { status: 400 });
  }

  const [created] = await db
    .insert(workDefects)
    .values({
      name: result.data.name,
      type: "component",
      workComponentId: result.data.workComponentId,
      workCategoryId: component[0].workCategoryId,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
