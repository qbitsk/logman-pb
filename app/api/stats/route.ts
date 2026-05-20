import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions } from "@/lib/db/schema";
import { eq, count, and, gte, lt } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/stats — worker production counts for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const [totalResult, newResult, completedResult] = await Promise.all([
    db.select({ count: count() }).from(workerProductions)
      .where(eq(workerProductions.userId, session.user.id)),
    db.select({ count: count() }).from(workerProductions)
      .where(and(eq(workerProductions.userId, session.user.id), gte(workerProductions.createdAt, startOfToday), lt(workerProductions.createdAt, startOfTomorrow))),
    db.select({ count: count() }).from(workerProductions)
      .where(and(eq(workerProductions.userId, session.user.id), lt(workerProductions.createdAt, startOfToday))),
  ]);

  return NextResponse.json({
    total: totalResult[0].count,
    new: newResult[0].count,
    completed: completedResult[0].count,
  });
}
