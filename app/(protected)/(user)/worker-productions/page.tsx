"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, X, Filter } from "lucide-react";
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
  status: string;
  units: number | null;
  shift: number | null;
  createdAt: string;
  productionPartName: string;
  productionProcessName: string;
  stationName: string | null;
};

const statusStyles: Record<string, string> = {
  new:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// Handles nullable string columns — null values never match an active filter.
const nullableIncludesString: FilterFn<WorkerProduction> = (row, columnId, filterValue: string) => {
  const val = row.getValue<string | null>(columnId);
  if (val == null) return false;
  return val.toLowerCase().includes(filterValue.toLowerCase());
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

function fmtDayMonth(value: string) {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function RowActions({
  row,
  onDeleted,
}: {
  row: WorkerProduction;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (row.status !== "new") return null;
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/worker-productions/${row.id}/edit`}
        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
        aria-label={t.workerProductions.editProduction}
      >
        <Pencil className="w-4 h-4" />
      </Link>
      <DeleteWorkerProductionButton
        id={row.id}
        apiPath="/api/worker-productions"
        onDeleted={onDeleted}
      />
    </div>
  );
}

export default function WorkerProductionsPage() {
  const { t } = useTranslation();
  const [productions, setProductions] = useState<WorkerProduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  useEffect(() => {
    fetch("/api/worker-productions")
      .then((r) => r.json())
      .then(setProductions)
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo<ColumnDef<WorkerProduction>[]>(
    () => [
      { accessorKey: "createdAt",             id: "date",    filterFn: dateRangeFilter   },
      { accessorKey: "productionProcessName", id: "process", filterFn: "equals" },
      { accessorKey: "productionPartName",    id: "product", filterFn: "equals" },
      { accessorKey: "stationName",           id: "station", filterFn: "equals"  },
      { accessorKey: "status",                id: "status",  filterFn: "equals" },
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">{t.workerProductions.title}</h1>
        <Link href="/worker-productions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t.workerProductions.newProduction}
        </Link>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.common.loading}</p>
        </div>
      ) : productions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">{t.workerProductions.noProductions}</p>
          <Link href="/worker-productions/new" className="btn-primary inline-flex">
            {t.workerProductions.createFirst}
          </Link>
        </div>
      ) : (
        <>
          {/* Filter toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative" ref={filterRef}>
              <button
                className="btn-secondary flex items-center gap-2 h-10 px-3"
                onClick={() => setFilterOpen((v) => !v)}
              >
                <Filter className="w-4 h-4" />
                {t.workerProductions.filter}
                {hasFilters && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-brand-600 text-white">
                    {columnFilters.length}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute left-0 top-full mt-1 z-20 w-80 card p-4 shadow-lg">
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className="input text-sm h-10"
                        aria-label={t.workerProductions.dateFrom}
                        value={getDateRange()[0]}
                        onChange={setDateFilter(0)}
                      />
                      <input
                        type="date"
                        className="input text-sm h-10"
                        aria-label={t.workerProductions.dateTo}
                        value={getDateRange()[1]}
                        onChange={setDateFilter(1)}
                      />
                    </div>
                    <select
                      className="input text-sm h-10"
                      value={getFilter("process")}
                      onChange={setFilter("process")}
                    >
                      <option value="">{t.workerProductions.process}</option>
                      {processOptions.map((o) => (
                        <option key={o} value={o} className="capitalize">{o}</option>
                      ))}
                    </select>
                    <select
                      className="input text-sm h-10"
                      value={getFilter("product")}
                      onChange={setFilter("product")}
                    >
                      <option value="">{t.workerProductions.product}</option>
                      {productOptions.map((o) => (
                        <option key={o} value={o} className="capitalize">{o}</option>
                      ))}
                    </select>
                    <select
                      className="input text-sm h-10"
                      value={getFilter("station")}
                      onChange={setFilter("station")}
                    >
                      <option value="">{t.workerProductions.station}</option>
                      {stationOptions.map((o) => (
                        <option key={o} value={o} className="capitalize">{o}</option>
                      ))}
                    </select>
                    <select
                      className="input text-sm h-10"
                      value={getFilter("status")}
                      onChange={setFilter("status")}
                    >
                      <option value="">{t.workerProductions.status}</option>
                      <option value="new">{t.status.new}</option>
                      <option value="completed">{t.status.completed}</option>
                    </select>
                    {hasFilters && (
                      <button
                        className="btn-secondary flex items-center justify-center gap-1.5 h-10 px-3"
                        onClick={() => { setColumnFilters([]); setFilterOpen(false); }}
                      >
                        <X className="w-3.5 h-3.5" />
                        {t.workerProductions.clearFilters}
                      </button>
                    )}
                  </div>
                </div>
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
              <div className="card p-5 hidden sm:block">
                <div className="mb-4">
                  <h5 className="text-lg font-semibold">Worker Productions</h5>
                  {/* <p className="text-xs font-medium text-gray-400 dark:text-gray-400">Overview of product performance</p> */}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs whitespace-nowrap text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pe-2 py-3 font-semibold">
                          {t.workerProductions.date}
                        </th>
                        <th className="px-2 py-3 font-semibold">
                          {`${t.workerProductions.process} / ${t.workerProductions.product}`}
                        </th>
                        <th className="px-2 py-3 font-semibold">
                          {t.workerProductions.station}
                        </th>
                        <th className="px-2 py-3 text-center font-semibold">
                          {t.workerProductions.shift}
                        </th>
                        <th className="px-2 py-3 text-center font-semibold">
                          {t.workerProductions.units}
                        </th>
                        <th className="px-2 py-3 text-center font-semibold">
                          {t.workerProductions.status}
                        </th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map(({ original: s }) => (
                        <tr
                          key={s.id}
                          className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <td className="pe-2 py-3 text-gray-400 dark:text-gray-500">
                            <Link
                              href={`/worker-productions/${s.id}`}
                              className="font-medium text-sm hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                            >
                              <span className="hidden md:block">{new Date(s.createdAt).toLocaleDateString()}</span>
                              <span className="md:hidden">{fmtDayMonth(s.createdAt)}</span>
                              {/* <span className="block text-xs">{new Date(s.createdAt).getFullYear()}</span> */}
                            </Link>
                          </td>
                          <td className="px-2 py-3 capitalize">
                            <span className="block font-medium leading-tight text-gray-700 dark:text-gray-200">{s.productionPartName}</span>
                            <span className="mt-0.5 block text-xs leading-tight text-gray-400 dark:text-gray-400">{s.productionProcessName}</span>
                          </td>
                          <td className="px-2 py-3 text-gray-500 dark:text-gray-400 capitalize">{s.stationName ?? <Dash />}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-gray-500 dark:text-gray-400">{s.shift ?? <Dash />}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-gray-500 dark:text-gray-400">{s.units ?? <Dash />}</td>
                          <td className="px-2 py-3 text-center">
                            <span className={clsx("badge capitalize", statusStyles[s.status])}>{t.status[s.status as keyof typeof t.status] ?? s.status}</span>
                          </td>
                          <td className="py-3 text-end">
                            <RowActions row={s} onDeleted={handleDeleted} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-3 sm:hidden">
                {filteredRows.map(({ original: s }) => (
                  <div key={s.id} className="card px-3 py-2">
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/worker-productions/${s.id}`}
                          className="text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          {new Date(s.createdAt).toLocaleDateString()}
                        </Link>
                        <span className={clsx("badge capitalize", statusStyles[s.status])}>{t.status[s.status as keyof typeof t.status] ?? s.status}</span>
                      </div>
                     <RowActions row={s} onDeleted={handleDeleted} />
                    </div>
                    <div className="pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="block font-medium leading-tight text-gray-700 dark:text-gray-200">{s.productionPartName}</span>
                      <span className="mt-0.5 block text-xs leading-tight text-gray-400 dark:text-gray-400">{s.productionProcessName}</span>      
                    </div>
                    <dl className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                      {/* <div key={t.workerProductions.product}>
                          <dd className="text-gray-700 dark:text-gray-300">
                            <span className="block font-medium leading-tight text-gray-700 dark:text-gray-200">{s.productionPartName}</span>
                            <span className="mt-0.5 block text-xs leading-tight text-gray-400 dark:text-gray-400">{s.productionProcessName}</span>
                          </dd>
                        </div> */}
                      {(
                        [
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
