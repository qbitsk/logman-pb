import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
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
  type: z.enum(["work", "defect"]),
});

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") as "work" | "defect" | null;

  const rows = type
    ? await db.select().from(categories).where(eq(categories.type, type)).orderBy(categories.name)
    : await db.select().from(categories).orderBy(categories.name);

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
    .insert(categories)
    .values({ name: result.data.name, type: result.data.type })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
