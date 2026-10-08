import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workerProductions, users, productionParts, productionProcesses, productionStations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/admin/worker-productions/filter-options — distinct values that occur in worker productions,
// used to populate the filter dropdowns of the paginated admin list (admin/operator)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(["admin", "operator"] as string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [processes, products, stations, userNames] = await Promise.all([
    db
      .selectDistinct({ name: productionProcesses.name })
      .from(workerProductions)
      .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
      .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
      .orderBy(productionProcesses.name),
    db
      .selectDistinct({ name: productionParts.name })
      .from(workerProductions)
      .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
      .orderBy(productionParts.name),
    db
      .selectDistinct({ name: productionStations.name })
      .from(workerProductions)
      .innerJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
      .orderBy(productionStations.name),
    db
      .selectDistinct({ name: users.name })
      .from(workerProductions)
      .innerJoin(users, eq(workerProductions.userId, users.id))
      .orderBy(users.name),
  ]);

  return NextResponse.json({
    processes: processes.map((r) => r.name),
    products: products.map((r) => r.name),
    stations: stations.map((r) => r.name),
    users: userNames.map((r) => r.name),
  });
}
