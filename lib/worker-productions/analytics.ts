import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  productionComponents,
  productionDefects,
  productionParts,
  productionProcesses,
  productionStations,
  users,
  workerProductionDefects,
  workerProductions,
} from "@/lib/db/schema";
import { workerProductionFilterWhere, type WorkerProductionFilters } from "@/lib/worker-productions/filters";

export type DefectType = "unit" | "component";

export type MonthlyProductions = {
  partNumbers: string[];
  months: { month: string; ok: number; nok: number; scrapRate: number | null }[];
  totals: { ok: number; nok: number; scrapRate: number | null };
};

export type MonthlyDefects = {
  partNumbers: string[];
  defects: string[];
  months: { month: string; total: number; values: Record<string, number> }[];
};

const TIMEZONE = "Europe/Bratislava";

// Past this span, empty months are trimmed so a half-typed year in a date filter
// ("0202-01-01") can't produce thousands of empty bars.
const MAX_MONTHS = 120;

// YYYY-MM of the production in factory-local time (created_at is stored as UTC).
// The timezone is inlined rather than bound: a bound parameter would make the SELECT and
// GROUP BY expressions differ, and Postgres would reject the query.
const monthColumn = sql<string>`to_char(${workerProductions.createdAt} at time zone 'UTC' at time zone ${sql.raw(`'${TIMEZONE}'`)}, 'YYYY-MM')`;

const sumUnits = (column: typeof workerProductions.units | typeof workerProductionDefects.units) =>
  sql<number>`cast(coalesce(sum(${column}), 0) as int)`;

export function scrapRate(ok: number, nok: number) {
  return ok > 0 ? nok / ok : null;
}

const monthIndex = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return year * 12 + m - 1;
};

const monthKey = (index: number) =>
  `${String(Math.floor(index / 12)).padStart(4, "0")}-${String((index % 12) + 1).padStart(2, "0")}`;

function localMonthIndex(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, year: "numeric", month: "numeric" }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return part("year") * 12 + part("month") - 1;
}

// Every month the chart should show, including empty ones, so the x axis stays a true
// time scale: from dateFrom (or the first month with data) to dateTo (or the current month).
function monthsToShow(filters: WorkerProductionFilters, dataMonths: string[]) {
  const data = dataMonths.map(monthIndex).sort((a, b) => a - b);
  const firstData = data[0];
  const lastData = data[data.length - 1];
  const hasData = data.length > 0;
  const current = localMonthIndex(new Date());

  let start = filters.dateFrom ? localMonthIndex(filters.dateFrom) : firstData;
  let end = filters.dateTo ? localMonthIndex(filters.dateTo) : current;
  if (start === undefined) return [];

  if (end - start >= MAX_MONTHS) {
    if (!hasData) return [];
    start = Math.max(start, firstData);
    end = Math.min(end, Math.max(lastData, current));
  }
  if (hasData) {
    start = Math.min(start, firstData);
    end = Math.max(end, lastData);
  }

  const months: string[] = [];
  for (let i = start; i <= end; i++) months.push(monthKey(i));
  return months;
}

// Numbers of the parts behind a product filter, for the chart title. The filter matches by
// name, and one name can cover several numbers.
async function getPartNumbers(filters: WorkerProductionFilters) {
  if (!filters.product) return [];

  const rows = await db
    .selectDistinct({ number: productionParts.number })
    .from(workerProductions)
    .innerJoin(users, eq(workerProductions.userId, users.id))
    .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
    .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
    .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
    .where(workerProductionFilterWhere(filters))
    .orderBy(productionParts.number);

  return rows.flatMap((r) => (r.number ? [r.number] : []));
}

// OK parts are the production's `units`; NOK parts are its part defects. The two are summed in
// separate queries because joining defects onto productions would repeat `units` per defect row.
export async function getMonthlyProductions(filters: WorkerProductionFilters): Promise<MonthlyProductions> {
  const where = workerProductionFilterWhere(filters);

  const [okRows, nokRows, partNumbers] = await Promise.all([
    db
      .select({ month: monthColumn, units: sumUnits(workerProductions.units) })
      .from(workerProductions)
      .innerJoin(users, eq(workerProductions.userId, users.id))
      .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
      .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
      .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
      .where(where)
      .groupBy(monthColumn),
    db
      .select({ month: monthColumn, units: sumUnits(workerProductionDefects.units) })
      .from(workerProductions)
      .innerJoin(users, eq(workerProductions.userId, users.id))
      .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
      .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
      .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
      .innerJoin(workerProductionDefects, eq(workerProductionDefects.workerProductionId, workerProductions.id))
      .innerJoin(productionDefects, eq(workerProductionDefects.productionDefectId, productionDefects.id))
      .where(and(where, eq(productionDefects.type, "unit")))
      .groupBy(monthColumn),
    getPartNumbers(filters),
  ]);

  const ok = new Map(okRows.map((r) => [r.month, r.units]));
  const nok = new Map(nokRows.map((r) => [r.month, r.units]));

  const months = monthsToShow(filters, [...ok.keys(), ...nok.keys()]).map((month) => {
    const okUnits = ok.get(month) ?? 0;
    const nokUnits = nok.get(month) ?? 0;
    return { month, ok: okUnits, nok: nokUnits, scrapRate: scrapRate(okUnits, nokUnits) };
  });

  const totalOk = months.reduce((sum, m) => sum + m.ok, 0);
  const totalNok = months.reduce((sum, m) => sum + m.nok, 0);

  return { partNumbers, months, totals: { ok: totalOk, nok: totalNok, scrapRate: scrapRate(totalOk, totalNok) } };
}

// Defect names are defined per part, so the same name on two parts adds up to one series.
// Component defects are labelled like the CSV export's columns.
export async function getMonthlyDefects(filters: WorkerProductionFilters, type: DefectType): Promise<MonthlyDefects> {
  const partNumbers = await getPartNumbers(filters);
  const rows = await db
    .select({
      month: monthColumn,
      name: productionDefects.name,
      component: productionComponents.name,
      units: sumUnits(workerProductionDefects.units),
    })
    .from(workerProductions)
    .innerJoin(users, eq(workerProductions.userId, users.id))
    .innerJoin(productionParts, eq(workerProductions.productionPartId, productionParts.id))
    .innerJoin(productionProcesses, eq(productionParts.productionProcessId, productionProcesses.id))
    .leftJoin(productionStations, eq(workerProductions.productionStationId, productionStations.id))
    .innerJoin(workerProductionDefects, eq(workerProductionDefects.workerProductionId, workerProductions.id))
    .innerJoin(productionDefects, eq(workerProductionDefects.productionDefectId, productionDefects.id))
    .leftJoin(productionComponents, eq(productionDefects.productionComponentId, productionComponents.id))
    .where(and(workerProductionFilterWhere(filters), eq(productionDefects.type, type)))
    .groupBy(monthColumn, productionDefects.name, productionComponents.name);

  const byMonth = new Map<string, Record<string, number>>();
  const names = new Set<string>();
  for (const row of rows) {
    const label = type === "component" ? `${row.component ?? "Unknown"} - ${row.name}` : row.name;
    names.add(label);
    const values = byMonth.get(row.month) ?? {};
    values[label] = (values[label] ?? 0) + row.units;
    byMonth.set(row.month, values);
  }

  return {
    partNumbers,
    defects: [...names].sort((a, b) => a.localeCompare(b)),
    months: monthsToShow(filters, [...byMonth.keys()]).map((month) => {
      const values = byMonth.get(month) ?? {};
      return { month, total: Object.values(values).reduce((sum, n) => sum + n, 0), values };
    }),
  };
}
