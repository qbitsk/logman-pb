import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { productionDefects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/work-defects — list work defects, optionally filtered by workCategoryId
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productionPartId = searchParams.get("productionPartId");

  const rows = productionPartId
    ? await db.select().from(productionDefects).where(eq(productionDefects.productionPartId, productionPartId))
    : await db.select().from(productionDefects);

  return NextResponse.json(rows);
}
