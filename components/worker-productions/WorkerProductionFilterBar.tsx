"use client";

import { useEffect, useRef, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { FilterKey, WorkerProductionFiltersState } from "@/lib/worker-productions/use-worker-production-filters";

// Search box and filter popover shared by the admin productions list and the analytics tabs.
// `children` are extra toolbar actions rendered after the filter button.
export function WorkerProductionFilterBar({
  filters,
  children,
}: {
  filters: WorkerProductionFiltersState;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { options, productOptions, values, activeCount } = filters;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const onSelect = (key: FilterKey) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    filters.setFilter(key, e.target.value);

  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          className="input h-10 pl-9 text-sm w-full"
          placeholder={t.workerProductions.searchPart}
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
        />
      </div>
      <div className="relative" ref={ref}>
        <button
          className="btn-secondary flex items-center gap-2 h-10 px-3"
          onClick={() => setOpen((v) => !v)}
        >
          <Filter className="w-4 h-4" />
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-brand-600 text-white">
              {activeCount}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-20 w-80 card p-4 shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input text-sm h-10"
                  aria-label={t.workerProductions.dateFrom}
                  value={filters.dateFrom}
                  onChange={(e) => filters.setDateFrom(e.target.value)}
                />
                <input
                  type="date"
                  className="input text-sm h-10"
                  aria-label={t.workerProductions.dateTo}
                  value={filters.dateTo}
                  onChange={(e) => filters.setDateTo(e.target.value)}
                />
              </div>
              <select className="input text-sm h-10" value={values.process} onChange={(e) => filters.setProcess(e.target.value)}>
                <option value="">{t.workerProductions.process}</option>
                {options.processes.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
              <select className="input text-sm h-10" value={values.product} onChange={onSelect("product")}>
                <option value="">{t.workerProductions.product}</option>
                {productOptions.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
              <select className="input text-sm h-10" value={values.station} onChange={onSelect("station")}>
                <option value="">{t.workerProductions.station}</option>
                {options.stations.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
              <select className="input text-sm h-10" value={values.status} onChange={onSelect("status")}>
                <option value="">{t.workerProductions.status}</option>
                <option value="new">{t.status.new}</option>
                <option value="completed">{t.status.completed}</option>
              </select>
              <select className="input text-sm h-10" value={values.user} onChange={onSelect("user")}>
                <option value="">{t.adminUsers.allUsers}</option>
                {options.users.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              {activeCount > 0 && (
                <button
                  className="btn-secondary flex items-center justify-center gap-1.5 h-10 px-3"
                  onClick={() => { filters.clearFilters(); setOpen(false); }}
                >
                  <X className="w-3.5 h-3.5" />
                  {t.workerProductions.clearFilters}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
