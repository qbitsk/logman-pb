import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workDefects, workComponents } from "@/lib/db/schema";
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
  workComponentId: z.string().min(1).optional(),
  workCategoryId: z.string().min(1).optional(),
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
  if (result.data.workCategoryId) update.workCategoryId = result.data.workCategoryId;

  if (result.data.workComponentId) {
    const component = await db
      .select({ workCategoryId: workComponents.workCategoryId })
      .from(workComponents)
      .where(eq(workComponents.id, result.data.workComponentId))
      .limit(1);

    if (!component[0]) {
      return NextResponse.json({ error: "Component not found" }, { status: 400 });
    }

    update.workComponentId = result.data.workComponentId;
    update.workCategoryId = component[0].workCategoryId;
  }

  const [updated] = await db
    .update(workDefects)
    .set(update)
    .where(eq(workDefects.id, id))
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
    .select({ id: workDefects.id })
    .from(workDefects)
    .where(eq(workDefects.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(workDefects).where(eq(workDefects.id, id));

  return new NextResponse(null, { status: 204 });
}
