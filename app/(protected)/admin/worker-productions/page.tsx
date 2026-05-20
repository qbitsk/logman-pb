"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { DeleteWorkerProductionButton } from "@/components/DeleteWorkerProductionButton";
import { clsx } from "clsx";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
} from "@tanstack/react-table";
import { useTranslation } from "@/lib/i18n";

type WorkerProduction = {
  id: string;
  productionPartName: string;
  productionProcessName: string;
  status: string;
  units: number | null;
  shift: number | null;
  createdAt: string;
  stationName: string | null;
  userName: string;
  userEmail: string;
};

const statusStyles: Record<string, string> = {
  new:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// Filters by a [from, to] date range (both optional). Compares calendar day only.
const dateRangeFilter: FilterFn<WorkerProduction> = (row, columnId, filterValue: [string, string]) => {
  const [from, to] = filterValue;
  const raw = row.getValue<string>(columnId);
  const d = new Date(raw);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (from && day < new Date(from).getTime()) return false;
  if (to   && day > new Date(to).getTime())   return false;
  return true;
};

function Dash() {
  return <span className="text-gray-300 dark:text-gray-600">—</span>;
}

function RowActions({
  row,
  onDeleted,
}: {
  row: WorkerProduction;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/worker-productions/${row.id}/edit`}
        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
        aria-label={t.workerProductions.editProduction}
      >
        <Pencil className="w-4 h-4" />
      </Link>
      <DeleteWorkerProductionButton
        id={row.id}
        apiPath="/api/admin/worker-productions"
        onDeleted={onDeleted}
      />
    </div>
  );
}

export default function AdminWorkerProductionsPage() {
  const { t } = useTranslation();
  const [productions, setProductions] = useState<WorkerProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    fetch("/api/admin/worker-productions")
      .then((r) => r.json())
      .then(setProductions)
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo<ColumnDef<WorkerProduction>[]>(
    () => [
      { accessorKey: "createdAt",             id: "date",    filterFn: dateRangeFilter },
      { accessorKey: "productionProcessName", id: "process", filterFn: "equals" },
      { accessorKey: "productionPartName",    id: "product", filterFn: "equals" },
      { accessorKey: "stationName",           id: "station", filterFn: "equals" },
      { accessorKey: "status",                id: "status",  filterFn: "equals" },
      { accessorKey: "userName",              id: "user",    filterFn: "equals" },
    ],
    [],
  );

  const table = useReactTable({
    data: productions,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const processOptions = useMemo(
    () => [...new Set(productions.map((p) => p.productionProcessName))].sort(),
    [productions],
  );
  const productOptions = useMemo(
    () => [...new Set(productions.map((p) => p.productionPartName))].sort(),
    [productions],
  );
  const stationOptions = useMemo(
    () => [...new Set(productions.map((p) => p.stationName).filter((s): s is string => s != null))].sort(),
    [productions],
  );
  const userOptions = useMemo(
    () => [...new Set(productions.map((p) => p.userName))].sort(),
    [productions],
  );

  const filteredRows = table.getFilteredRowModel().rows;
  const hasFilters = columnFilters.length > 0;

  const getFilter = (id: string) =>
    (table.getColumn(id)?.getFilterValue() as string) ?? "";

  const getDateRange = () =>
    (table.getColumn("date")?.getFilterValue() as [string, string]) ?? ["", ""];

  const setDateFilter = (index: 0 | 1) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = [...getDateRange()] as [string, string];
    next[index] = e.target.value;
    if (!next[0] && !next[1]) {
      table.getColumn("date")?.setFilterValue(undefined);
    } else {
      table.getColumn("date")?.setFilterValue(next);
    }
  };

  const setFilter =
    (id: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      table.getColumn(id)?.setFilterValue(e.target.value || undefined);

  const handleDeleted = (id: string) =>
    setProductions((prev) => prev.filter((x) => x.id !== id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">{t.adminProductions.title}</h1>
        {!loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.workerProductions.showing(hasFilters ? filteredRows.length : productions.length, productions.length)}
          </p>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.common.loading}</p>
        </div>
      ) : productions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.workerProductions.noProductions}</p>
        </div>
      ) : (
        <>
          {/* Filter toolbar */}
          <div className="card mb-4 p-2">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="date"
                className="input text-sm h-10 flex-1 min-w-[140px]"
                aria-label={t.workerProductions.dateFrom}
                value={getDateRange()[0]}
                onChange={setDateFilter(0)}
              />
              <input
                type="date"
                className="input text-sm h-10 flex-1 min-w-[140px]"
                aria-label={t.workerProductions.dateTo}
                value={getDateRange()[1]}
                onChange={setDateFilter(1)}
              />
              <select
                className="input text-sm h-10 flex-1 min-w-[150px]"
                value={getFilter("process")}
                onChange={setFilter("process")}
              >
                <option value="">{t.workerProductions.process}</option>
                {processOptions.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
              <select
                className="input text-sm h-10 flex-1 min-w-[150px]"
                value={getFilter("product")}
                onChange={setFilter("product")}
              >
                <option value="">{t.workerProductions.product}</option>
                {productOptions.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
              <select
                className="input text-sm h-10 flex-1 min-w-[140px]"
                value={getFilter("station")}
                onChange={setFilter("station")}
              >
                <option value="">{t.workerProductions.station}</option>
                {stationOptions.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
              <select
                className="input text-sm h-10 flex-1 min-w-[140px]"
                value={getFilter("status")}
                onChange={setFilter("status")}
              >
                <option value="">{t.workerProductions.status}</option>
                <option value="new">{t.status.new}</option>
                <option value="completed">{t.status.completed}</option>
              </select>
              <select
                className="input text-sm h-10 flex-1 min-w-[150px]"
                value={getFilter("user")}
                onChange={setFilter("user")}
              >
                <option value="">{t.adminUsers.allUsers}</option>
                {userOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  className="btn-secondary flex items-center gap-1.5 h-10 px-3 whitespace-nowrap"
                  onClick={() => setColumnFilters([])}
                >
                  <X className="w-3.5 h-3.5" />
                  {t.workerProductions.clearFilters}
                </button>
              )}
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">{t.workerProductions.noProductions}</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card p-0 overflow-x-auto hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      {[t.workerProductions.date, t.workerProductions.process, t.workerProductions.product, t.workerProductions.station, t.workerProductions.shift, t.workerProductions.units, t.workerProductions.status, t.adminUsers.user, ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(({ original: s }) => (
                      <tr
                        key={s.id}
                        className="border-b border-gray-50 hover:bg-brand-50/40 dark:border-gray-700/50 dark:hover:bg-brand-900/10 transition-colors"
                      >
                        <td className="px-3 py-2 text-gray-400 dark:text-gray-500">
                          <Link
                            href={`/admin/worker-productions/${s.id}`}
                            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                          >
                            {new Date(s.createdAt).toLocaleDateString()}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 capitalize">{s.productionProcessName}</td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 capitalize">{s.productionPartName}</td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 capitalize">{s.stationName ?? <Dash />}</td>
                        <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{s.shift ?? <Dash />}</td>
                        <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{s.units ?? <Dash />}</td>
                        <td className="px-3 py-2">
                          <span className={clsx("badge capitalize", statusStyles[s.status])}>{t.status[s.status as keyof typeof t.status] ?? s.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{s.userName}</td>
                        <td className="pe-3 py-2 text-end">
                          <RowActions row={s} onDeleted={handleDeleted} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredRows.map(({ original: s }) => (
                  <div key={s.id} className="card px-3 py-2">
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/worker-productions/${s.id}`}
                          className="text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          {new Date(s.createdAt).toLocaleDateString()}
                        </Link>
                        <span className={clsx("badge capitalize", statusStyles[s.status])}>{t.status[s.status as keyof typeof t.status] ?? s.status}</span>
                      </div>
                      <RowActions row={s} onDeleted={handleDeleted} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{s.userName}</p>
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      {(
                        [
                          [t.workerProductions.process, s.productionProcessName, true],
                          [t.workerProductions.product, s.productionPartName, true],
                          [t.workerProductions.station, s.stationName, true],
                          [t.workerProductions.shift, s.shift, false],
                          [t.workerProductions.units, s.units, false],
                        ] as [string, string | number | null, boolean][]
                      ).map(([label, value, cap]) => (
                        <div key={label}>
                          <dt className="text-xs text-gray-400 dark:text-gray-500">{label}</dt>
                          <dd className={clsx("text-gray-700 dark:text-gray-300", cap && "capitalize")}>
                            {value ?? <Dash />}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
