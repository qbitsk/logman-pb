import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { productionDefects, productionComponents, productionProducts } from "@/lib/db/schema";
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
  productionComponentId: z.string().min(1),
});

const unitBodySchema = z.object({
  name: z.string().min(1),
  productionProductId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") as "component" | "unit" | null;

  const componentRows = await db
    .select({
      id: productionDefects.id,
      name: productionDefects.name,
      type: productionDefects.type,
      productionProductId: productionDefects.productionProductId,
      productionComponentId: productionDefects.productionComponentId,
      componentName: productionComponents.name,
      workProductName: productionProducts.name,
      createdAt: productionDefects.createdAt,
      updatedAt: productionDefects.updatedAt,
    })
    .from(productionDefects)
    .leftJoin(productionComponents, eq(productionDefects.productionComponentId, productionComponents.id))
    .leftJoin(productionProducts, eq(productionDefects.productionProductId, productionProducts.id))
    .where(type ? eq(productionDefects.type, type) : undefined)
    .orderBy(productionProducts.name, productionComponents.name, productionDefects.name);

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
      .insert(productionDefects)
      .values({
        name: result.data.name,
        type: "unit",
        productionProductId: result.data.productionProductId,
        productionComponentId: null,
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
    .select({ productionProductId: productionComponents.productionProductId })
    .from(productionComponents)
    .where(eq(productionComponents.id, result.data.productionComponentId))
    .limit(1);

  if (!component[0]) {
    return NextResponse.json({ error: "Component not found" }, { status: 400 });
  }

  const [created] = await db
    .insert(productionDefects)
    .values({
      name: result.data.name,
      type: "component",
      productionComponentId: result.data.productionComponentId,
      productionProductId: component[0].productionProductId,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
