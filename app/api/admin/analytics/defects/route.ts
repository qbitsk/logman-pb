import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getMonthlyDefects } from "@/lib/worker-productions/analytics";
import { parseWorkerProductionFilters } from "@/lib/worker-productions/filters";
import { headers } from "next/headers";

// GET /api/admin/analytics/defects — defect units per month, broken down by defect name (admin/operator)
// Query: defectType (unit|component, default unit), plus the filters from parseWorkerProductionFilters
// (dateFrom, dateTo, process, product, station, status, user, partSearch).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(["admin", "operator"] as string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const type = sp.get("defectType") === "component" ? "component" : "unit";

  return NextResponse.json(await getMonthlyDefects(parseWorkerProductionFilters(sp), type));
}
