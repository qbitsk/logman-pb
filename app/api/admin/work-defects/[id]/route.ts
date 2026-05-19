import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { productionDefects, productionComponents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") return null;
  return session;
}

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  productionComponentId: z.string().min(1).optional(),
  productionProductId: z.string().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const result = bodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (result.data.name) update.name = result.data.name;
  if (result.data.productionProductId) update.productionProductId = result.data.productionProductId;

  if (result.data.productionComponentId) {
    const component = await db
      .select({ productionProductId: productionComponents.productionProductId })
      .from(productionComponents)
      .where(eq(productionComponents.id, result.data.productionComponentId))
      .limit(1);

    if (!component[0]) {
      return NextResponse.json({ error: "Component not found" }, { status: 400 });
    }

    update.productionComponentId = result.data.productionComponentId;
    update.productionProductId = component[0].productionProductId;
  }

  const [updated] = await db
    .update(productionDefects)
    .set(update)
    .where(eq(productionDefects.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: productionDefects.id })
    .from(productionDefects)
    .where(eq(productionDefects.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await db.delete(productionDefects).where(eq(productionDefects.id, id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete defect." }, { status: 500 });
  }
}
