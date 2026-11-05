import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getMonthlyProductions } from "@/lib/worker-productions/analytics";
import { parseWorkerProductionFilters } from "@/lib/worker-productions/filters";
import { headers } from "next/headers";

// GET /api/admin/analytics/productions — OK parts, NOK parts and scrap rate per month (admin/operator)
// Query: the filters from parseWorkerProductionFilters (dateFrom, dateTo, process, product, station, status, user, partSearch).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(["admin", "operator"] as string[]).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await getMonthlyProductions(parseWorkerProductionFilters(request.nextUrl.searchParams)));
}
