import { and, eq, gte, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { workerProductions, users, productionParts, productionProcesses, productionStations } from "@/lib/db/schema";

// Filters shared by the admin worker-productions list and the CSV export, so both
// always return the same set of rows for the same query string.
export type WorkerProductionFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  process?: string;
  product?: string;
  station?: string;
  status?: "new" | "completed";
  user?: string;
  partSearch?: string;
};

// Accepts a full ISO timestamp (sent by the browser so day boundaries follow the
// user's timezone) or a plain YYYY-MM-DD date (interpreted in server time).
function parseDate(value: string | null, endOfDay: boolean): Date | undefined {
  if (!value) return undefined;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`)
    : new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function parseWorkerProductionFilters(sp: URLSearchParams): WorkerProductionFilters {
  const status = sp.get("status");
  return {
    dateFrom:   parseDate(sp.get("dateFrom"), false),
    dateTo:     parseDate(sp.get("dateTo"), true),
    process:    sp.get("process")    || undefined,
    product:    sp.get("product")    || undefined,
    station:    sp.get("station")    || undefined,
    status:     status === "new" || status === "completed" ? status : undefined,
    user:       sp.get("user")       || undefined,
    partSearch: sp.get("partSearch")?.trim() || undefined,
  };
}

// Lowercases and strips Slovak/Czech diacritics in SQL without needing the unaccent extension.
const ACCENTED = "áäčďéěíĺľňóôöŕřšťúůüýž";
const PLAIN    = "aacdeeillnooorrstuuuyz";

function normalizeSearch(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\\%_]/g, "\\$&");
}

// Builds the WHERE clause. The query must join users, productionParts,
// productionProcesses and productionStations.
export function workerProductionFilterWhere(f: WorkerProductionFilters): SQL | undefined {
  // "new" = created today (server time), mirroring getWorkerProductionStatus().
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const conditions: (SQL | undefined)[] = [
    f.dateFrom ? gte(workerProductions.createdAt, f.dateFrom) : undefined,
    f.dateTo   ? lte(workerProductions.createdAt, f.dateTo)   : undefined,
    f.process  ? eq(productionProcesses.name, f.process)      : undefined,
    f.product  ? eq(productionParts.name, f.product)          : undefined,
    f.station  ? eq(productionStations.name, f.station)       : undefined,
    f.user     ? eq(users.name, f.user)                       : undefined,
    f.status === "new"
      ? and(gte(workerProductions.createdAt, todayStart), lt(workerProductions.createdAt, tomorrowStart))
      : f.status === "completed"
        ? or(lt(workerProductions.createdAt, todayStart), gte(workerProductions.createdAt, tomorrowStart))
        : undefined,
    f.partSearch
      ? sql`translate(lower(${productionParts.name}), ${ACCENTED}, ${PLAIN}) like ${`%${normalizeSearch(f.partSearch)}%`}`
      : undefined,
  ];
  const defined = conditions.filter((c): c is SQL => c !== undefined);
  return defined.length > 0 ? and(...defined) : undefined;
}
