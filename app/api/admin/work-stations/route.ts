import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { productionStations, productionProducts } from "@/lib/db/schema";
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
  productionProductId: z.string().min(1),
});

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: productionStations.id,
      name: productionStations.name,
      productionProductId: productionStations.productionProductId,
      workProductName: productionProducts.name,
      createdAt: productionStations.createdAt,
      updatedAt: productionStations.updatedAt,
    })
    .from(productionStations)
    .innerJoin(productionProducts, eq(productionStations.productionProductId, productionProducts.id))
    .orderBy(productionProducts.name, productionStations.name);

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
    .insert(productionStations)
    .values({ name: result.data.name, productionProductId: result.data.productionProductId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
