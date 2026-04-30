import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/stats — submission counts for the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalResult, submittedResult, approvedResult] = await Promise.all([
    db.select({ count: count() }).from(submissions)
      .where(eq(submissions.userId, session.user.id)),
    db.select({ count: count() }).from(submissions)
      .where(and(eq(submissions.userId, session.user.id), eq(submissions.status, "submitted"))),
    db.select({ count: count() }).from(submissions)
      .where(and(eq(submissions.userId, session.user.id), eq(submissions.status, "approved"))),
  ]);

  return NextResponse.json({
    total: totalResult[0].count,
    submitted: submittedResult[0].count,
    approved: approvedResult[0].count,
  });
}
