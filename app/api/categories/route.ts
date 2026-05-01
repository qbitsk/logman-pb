import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/categories?type=work|defect — list categories filtered by type
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") as "product" | "defect" | null;

  const query = db.select().from(categories).orderBy(categories.name);
  const rows = type
    ? await db.select().from(categories).where(eq(categories.type, type)).orderBy(categories.name)
    : await query;

  return NextResponse.json(rows);
}
