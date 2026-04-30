import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workComponentDefectCategories } from "@/lib/db/schema";
import { headers } from "next/headers";

// GET /api/work-component-defect-categories — list all defect categories (any authenticated user)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(workComponentDefectCategories)
    .orderBy(workComponentDefectCategories.name);

  return NextResponse.json(rows);
}
