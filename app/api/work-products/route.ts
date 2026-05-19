import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { productionParts } from "@/lib/db/schema";
import { headers } from "next/headers";

// GET /api/work-products — list all work products (any authenticated user)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(productionParts)
    .orderBy(productionParts.name);

  return NextResponse.json(rows);
}
