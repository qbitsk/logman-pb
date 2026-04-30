import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workDefects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/work-defects — list work defects, optionally filtered by workCategoryId
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workCategoryId = searchParams.get("workCategoryId");

  const rows = workCategoryId
    ? await db.select().from(workDefects).where(eq(workDefects.workCategoryId, workCategoryId))
    : await db.select().from(workDefects);

  return NextResponse.json(rows);
}
