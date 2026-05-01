import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/stats — worker production counts for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalResult, newResult, approvedResult] = await Promise.all([
    db.select({ count: count() }).from(workerProductions)
      .where(eq(workerProductions.userId, session.user.id)),
    db.select({ count: count() }).from(workerProductions)
      .where(and(eq(workerProductions.userId, session.user.id), eq(workerProductions.status, "new"))),
    db.select({ count: count() }).from(workerProductions)
      .where(and(eq(workerProductions.userId, session.user.id), eq(workerProductions.status, "approved"))),
  ]);

  return NextResponse.json({
    total: totalResult[0].count,
    new: newResult[0].count,
    approved: approvedResult[0].count,
  });
}
