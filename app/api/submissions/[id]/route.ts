import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/submissions/[id] — fetch a single submission owned by the current user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [submission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
    .limit(1);

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(submission);
}
