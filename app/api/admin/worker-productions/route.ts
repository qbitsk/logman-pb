import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, users, productionParts, productionProcesses, getWorkerProductionStatus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/admin/worker-productions — list all worker productions with user info (admin/operator)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(["admin", "operator"] as string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: workerProductions.id,
      units: workerProductions.units,
      createdAt: workerProductions.createdAt,
      productionPartName: productionParts.name,
      productionProcessName: productionProcesses.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(workerProductions)
    .innerJoin(users, eq(workerProductions.userId, users.id))
    .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
    .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
    .orderBy(workerProductions.createdAt);

  return NextResponse.json(rows.map((r) => ({ ...r, status: getWorkerProductionStatus(r.createdAt) })));
}
