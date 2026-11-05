"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, CheckCircle, Download } from "lucide-react";
import { DeleteWorkerProductionButton } from "@/components/DeleteWorkerProductionButton";
import { WorkerProductionFilterBar } from "@/components/worker-productions/WorkerProductionFilterBar";
import { clsx } from "clsx";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type Column,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useTranslation } from "@/lib/i18n";
import { withListQuery } from "@/lib/worker-productions/admin-list-url";
import { useWorkerProductionFilters } from "@/lib/worker-productions/use-worker-production-filters";

type WorkerProduction = {
  id: string;
  productionPartName: string;
  productionPartNumber: string | null;
  productionProcessName: string;
  status: string;
  units: number | null;
  shift: number | null;
  createdAt: string;
  stationName: string | null;
  userName: string;
  userEmail: string;
  defectedProducts: number;
  defectedComponents: number;
};

const statusStyles: Record<string, string> = {
  new:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
};

const PAGE_SIZES = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_SORTING: SortingState = [{ id: "date", desc: true }];
const SORTABLE = ["date", "product", "station", "shift", "units", "status", "user"];
// The list view (page, page size, sort, filters, search) lives in the URL so it survives
// navigating to a production and back, and the browser back button steps through pages.
function parseListState(sp: URLSearchParams) {
  const sizeParam = Number(sp.get("size"));
  const pageSize = PAGE_SIZES.includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE;
  const pageIndex = Math.max(0, (Math.floor(Number(sp.get("page"))) || 1) - 1);

  const sortParam = sp.get("sort") ?? "";
  const sorting: SortingState = SORTABLE.includes(sortParam)
    ? [{ id: sortParam, desc: sp.get("dir") !== "asc" }]
    : DEFAULT_SORTING;

  return { pagination: { pageIndex, pageSize }, sorting };
}

function Dash() {
  return <span className="text-gray-300 dark:text-gray-600">—</span>;
}

function fmtDayMonth(value: string) {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SortIcon({ column }: { column: Column<WorkerProduction> }) {
  const dir = column.getIsSorted();
  if (dir === "asc")  return <ChevronUp className="w-3 h-3" />;
  if (dir === "desc") return <ChevronDown className="w-3 h-3" />;
  return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className="btn-secondary h-9 w-9 flex items-center justify-center p-0 disabled:opacity-40 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function RowActions({
  row,
  listQuery,
  onDeleted,
}: {
  row: WorkerProduction;
  listQuery: string;
  onDeleted: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={withListQuery(`/admin/worker-productions/${row.id}/edit`, listQuery)}
        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-sm transition-colors"
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
  return (
    <Suspense>
      <AdminWorkerProductionsList />
    </Suspense>
  );
}

function AdminWorkerProductionsList() {
  const { t } = useTranslation();
  const filters = useWorkerProductionFilters();
  const { query: listQuery, filterQuery, appliedSearch, updateQuery } = filters;
  const { pagination, sorting } = useMemo(
    () => parseListState(new URLSearchParams(listQuery)),
    [listQuery],
  );

  const [productions, setProductions] = useState<WorkerProduction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const setSorting = (next: SortingState) => {
    const s = next[0];
    const isDefault = !s || (s.id === DEFAULT_SORTING[0].id && s.desc === DEFAULT_SORTING[0].desc);
    updateQuery({ sort: isDefault ? undefined : s.id, dir: isDefault ? undefined : s.desc ? "desc" : "asc" });
  };

  const setPagination = (next: PaginationState) => {
    if (next.pageSize !== pagination.pageSize) {
      updateQuery({ size: next.pageSize === DEFAULT_PAGE_SIZE ? undefined : String(next.pageSize) });
    } else if (next.pageIndex !== pagination.pageIndex) {
      updateQuery({ page: String(next.pageIndex + 1) }, { history: "push", resetPage: false });
    }
  };

  const { pageIndex, pageSize } = pagination;
  const sortId = sorting[0].id;
  const sortDesc = sorting[0].desc;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(filterQuery);
    params.set("page", String(pageIndex + 1));
    params.set("pageSize", String(pageSize));
    params.set("sort", sortId);
    params.set("dir", sortDesc ? "desc" : "asc");
    setFetching(true);
    fetch(`/api/admin/worker-productions?${params.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((res: { items: WorkerProduction[]; total: number }) => {
        // The current page can fall off the end after deletions — jump to the last one
        const lastPageIndex = Math.max(0, Math.ceil(res.total / pageSize) - 1);
        if (pageIndex > lastPageIndex) {
          updateQuery({ page: String(lastPageIndex + 1) }, { resetPage: false });
          return;
        }
        setProductions(res.items);
        setTotal(res.total);
        setLoadError(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setLoadError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setFetching(false);
      });
    return () => controller.abort();
  }, [filterQuery, sortId, sortDesc, pageIndex, pageSize, reloadKey, updateQuery]);

  const columns = useMemo<ColumnDef<WorkerProduction>[]>(
    () => [
      { accessorKey: "createdAt",             id: "date" },
      { accessorKey: "productionProcessName", id: "process" },
      { accessorKey: "productionPartName",    id: "product" },
      { accessorKey: "stationName",           id: "station" },
      { accessorKey: "status",                id: "status" },
      { accessorKey: "userName",              id: "user" },
      { accessorKey: "shift",                 id: "shift" },
      { accessorKey: "units",                 id: "units" },
    ],
    [],
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Sorting and pagination happen server-side; the table only holds their state.
  const table = useReactTable({
    data: productions,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => setSorting(typeof updater === "function" ? updater(sorting) : updater),
    onPaginationChange: (updater) => setPagination(typeof updater === "function" ? updater(pagination) : updater),
    manualSorting: true,
    manualPagination: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const hasFilters = filters.activeCount > 0;
  const rangeFrom = total === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeTo = Math.min(total, (pageIndex + 1) * pageSize);

  const handleDeleted = () => setReloadKey((k) => k + 1);

  const [csvLoading, setCsvLoading] = useState(false);

  const exportCSV = async () => {
    setCsvLoading(true);
    try {
      const params = new URLSearchParams(filterQuery);
      params.set("format", "csv");

      const res = await fetch(`/api/exports?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worker-productions-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-950 dark:text-white">{t.adminProductions.title}</h1>
          {!loading && !loadError && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {total} {t.adminProductions.total}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.common.loading}</p>
        </div>
      ) : loadError ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.common.failedToLoad}</p>
        </div>
      ) : total === 0 && !hasFilters && !appliedSearch ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.workerProductions.noProductions}</p>
        </div>
      ) : (
        <>
          {/* Filter toolbar */}
          <WorkerProductionFilterBar filters={filters}>
            <button
              className="btn-secondary flex items-center gap-2 h-10 px-3"
              onClick={exportCSV}
              disabled={csvLoading}
              title={t.adminProductions.exportCsv}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{csvLoading ? t.exports.generating : t.adminProductions.exportCsv}</span>
            </button>
          </WorkerProductionFilterBar>

          {rows.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">{t.workerProductions.noProductions}</p>
            </div>
          ) : (
            <div className={clsx("transition-opacity", fetching && "opacity-60")}>
              {/* Desktop table */}
              <div className="card px-5 py-3 hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs whitespace-nowrap text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pe-2 py-3 font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none"
                            onClick={() => table.getColumn("date")?.toggleSorting()}
                          >
                            {t.workerProductions.date}
                            <SortIcon column={table.getColumn("date")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3 font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none"
                            onClick={() => table.getColumn("product")?.toggleSorting()}
                          >
                            {`${t.workerProductions.process} / ${t.workerProductions.product}`}
                            <SortIcon column={table.getColumn("product")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3 font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none"
                            onClick={() => table.getColumn("station")?.toggleSorting()}
                          >
                            {t.workerProductions.station}
                            <SortIcon column={table.getColumn("station")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none mx-auto"
                            onClick={() => table.getColumn("shift")?.toggleSorting()}
                          >
                            {t.workerProductions.shift}
                            <SortIcon column={table.getColumn("shift")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none mx-auto"
                            onClick={() => table.getColumn("units")?.toggleSorting()}
                          >
                            {t.workerProductions.units}
                            <SortIcon column={table.getColumn("units")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3 text-center font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none mx-auto"
                            onClick={() => table.getColumn("status")?.toggleSorting()}
                          >
                            {t.workerProductions.status}
                            <SortIcon column={table.getColumn("status")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3 font-semibold">
                          <button
                            className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors select-none"
                            onClick={() => table.getColumn("user")?.toggleSorting()}
                          >
                            {t.adminUsers.user}
                            <SortIcon column={table.getColumn("user")!} />
                          </button>
                        </th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ original: s }) => (
                        <tr
                          key={s.id}
                          className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <td className="pe-2 py-3 text-gray-400 dark:text-gray-500">
                            <Link
                              href={withListQuery(`/admin/worker-productions/${s.id}`, listQuery)}
                              className="font-medium text-sm hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                            >
                              <span className="hidden md:block">{new Date(s.createdAt).toLocaleDateString()}</span>
                              <span className="md:hidden">{fmtDayMonth(s.createdAt)}</span>
                            </Link>
                          </td>
                          <td className="px-2 py-3 capitalize">
                            <span className="block font-medium leading-tight text-gray-700 dark:text-gray-200">
                              {s.productionPartName.replaceAll("_", "_​")}
                              {s.productionPartNumber && <span className="ml-2 inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{s.productionPartNumber}</span>}
                            </span>
                            <span className="mt-0.5 block text-xs leading-tight text-gray-400 dark:text-gray-400">{s.productionProcessName}</span>
                          </td>
                          <td className="px-2 py-3 text-gray-500 dark:text-gray-400 capitalize">{s.stationName ?? <Dash />}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-gray-500 dark:text-gray-400">{s.shift ?? <Dash />}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <span className="text-emerald-600">{s.units ?? 0}</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-red-600">{s.defectedProducts}</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-orange-600">{s.defectedComponents}</span>
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={clsx("badge capitalize hidden xl:inline", statusStyles[s.status])}>{t.status[s.status as keyof typeof t.status] ?? s.status}</span>
                            <span className="flex w-full items-center xl:hidden justify-center"><StatusIcon status={s.status} /></span>
                          </td>
                          <td className="px-2 py-3 font-medium text-gray-700 dark:text-gray-200">{s.userName}</td>
                          <td className="py-3 text-end">
                            <RowActions row={s} listQuery={listQuery} onDeleted={handleDeleted} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-3 sm:hidden">
                {rows.map(({ original: s }) => (
                  <div key={s.id} className="card px-3 py-2">
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <Link
                          href={withListQuery(`/admin/worker-productions/${s.id}`, listQuery)}
                          className="text-sm font-medium tabular-nums text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          {new Date(s.createdAt).toLocaleDateString()}
                        </Link>
                        <StatusIcon status={s.status} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{s.userName}</span>
                      </div>
                      <RowActions row={s} listQuery={listQuery} onDeleted={handleDeleted} />
                    </div>
                    <div className="pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="block font-medium leading-tight text-gray-700 dark:text-gray-200">
                        {s.productionPartName}
                        {s.productionPartNumber && <span className="ml-2 inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{s.productionPartNumber}</span>}
                      </span>
                      <span className="mt-0.5 block text-xs leading-tight text-gray-400 dark:text-gray-400">{s.productionProcessName}</span>
                    </div>
                    <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                      {(
                        [
                          [t.workerProductions.station, s.stationName, true],
                          [t.workerProductions.shift, s.shift, false],
                        ] as [string, string | number | null, boolean][]
                      ).map(([label, value, cap]) => (
                        <div key={label}>
                          <dt className="text-xs text-gray-400 dark:text-gray-500">{label}</dt>
                          <dd className={clsx("text-gray-700 dark:text-gray-300", cap && "capitalize")}>
                            {value ?? <Dash />}
                          </dd>
                        </div>
                      ))}
                      <div>
                        <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductions.units}</dt>
                        <dd className="tabular-nums">
                          <span className="inline-flex items-center gap-1 font-medium">
                              <span className="text-emerald-600">{s.units ?? 0}</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-red-600">{s.defectedProducts}</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-orange-600">{s.defectedComponents}</span>
                            </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <label className="flex items-center gap-2">
                <span className="hidden sm:inline">{t.workerProductions.rowsPerPage}</span>
                <select
                  className="input h-9 py-0 pl-2.5! pr-8! text-sm w-auto"
                  value={pageSize}
                  onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              <span className="tabular-nums">{t.workerProductions.range(rangeFrom, rangeTo, total)}</span>
              <div className="flex items-center gap-1">
                <PageButton onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()} label={t.workerProductions.firstPage}>
                  <ChevronsLeft className="w-4 h-4" />
                </PageButton>
                <PageButton onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} label={t.workerProductions.previousPage}>
                  <ChevronLeft className="w-4 h-4" />
                </PageButton>
                <span className="px-2 tabular-nums whitespace-nowrap">{t.workerProductions.pageOf(pageIndex + 1, pageCount)}</span>
                <PageButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} label={t.workerProductions.nextPage}>
                  <ChevronRight className="w-4 h-4" />
                </PageButton>
                <PageButton onClick={() => table.lastPage()} disabled={!table.getCanNextPage()} label={t.workerProductions.lastPage}>
                  <ChevronsRight className="w-4 h-4" />
                </PageButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
