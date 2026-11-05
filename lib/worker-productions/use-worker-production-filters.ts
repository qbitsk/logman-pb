"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FilterOptions = {
  processes: string[];
  products: string[];
  stations: string[];
  users: string[];
  productsByProcess: Record<string, string[]>;
};

export const FILTER_KEYS = ["process", "product", "station", "status", "user"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

const EMPTY_OPTIONS: FilterOptions = { processes: [], products: [], stations: [], users: [], productsByProcess: {} };

type UpdateOptions = { history?: "push" | "replace"; resetPage?: boolean };

// Turns the page URL's filter params into the query string the filtered API routes expect.
// Dates are sent as ISO timestamps so day boundaries follow the browser's timezone.
export function workerProductionFilterQuery(sp: URLSearchParams) {
  const params = new URLSearchParams();
  const from = sp.get("from");
  const to = sp.get("to");
  if (from) params.set("dateFrom", new Date(`${from}T00:00:00`).toISOString());
  if (to) params.set("dateTo", new Date(`${to}T23:59:59.999`).toISOString());
  for (const key of FILTER_KEYS) {
    const value = sp.get(key);
    if (value) params.set(key, value);
  }
  const search = sp.get("q");
  if (search) params.set("partSearch", search);
  return params.toString();
}

// The filters live in the URL so they survive navigating to a production and back, and so
// the productions list and the analytics tabs can share them.
export function useWorkerProductionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const { dateFrom, dateTo, values, appliedSearch, filterQuery } = useMemo(() => {
    const sp = new URLSearchParams(query);
    return {
      dateFrom: sp.get("from") ?? "",
      dateTo: sp.get("to") ?? "",
      values: Object.fromEntries(FILTER_KEYS.map((key) => [key, sp.get(key) ?? ""])) as Record<FilterKey, string>,
      appliedSearch: sp.get("q") ?? "",
      filterQuery: workerProductionFilterQuery(sp),
    };
  }, [query]);

  const [options, setOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [search, setSearch] = useState(appliedSearch);

  // Keep the search box in sync when the URL changes from outside (back/forward)
  const [prevAppliedSearch, setPrevAppliedSearch] = useState(appliedSearch);
  if (appliedSearch !== prevAppliedSearch) {
    setPrevAppliedSearch(appliedSearch);
    if (appliedSearch !== search.trim()) setSearch(appliedSearch);
  }

  // Writes changes into the URL. Page changes push a history entry (so "back" returns to the
  // previous page); filter/sort/search changes replace it and jump back to page 1.
  const updateQuery = useCallback(
    (changes: Record<string, string | undefined>, { history = "replace", resetPage = true }: UpdateOptions = {}) => {
      const params = new URLSearchParams(query);
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (resetPage || params.get("page") === "1") params.delete("page");
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (history === "push") router.push(href);
      else router.replace(href, { scroll: false });
    },
    [query, pathname, router],
  );

  // Debounce the part search so typing doesn't fire a request per keystroke
  useEffect(() => {
    const q = search.trim();
    if (q === appliedSearch) return;
    const timeout = setTimeout(() => updateQuery({ q: q || undefined }), 300);
    return () => clearTimeout(timeout);
  }, [search, appliedSearch, updateQuery]);

  useEffect(() => {
    fetch("/api/admin/worker-productions/filter-options")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setOptions)
      .catch(() => {});
  }, []);

  const setFilter = (key: FilterKey, value: string) => updateQuery({ [key]: value || undefined });

  // A product from another process would leave the results empty, so it's dropped with the switch.
  const setProcess = (value: string) => {
    const products = options.productsByProcess[value];
    const keepProduct = !products || products.includes(values.product);
    updateQuery({ process: value || undefined, ...(keepProduct ? {} : { product: undefined }) });
  };

  const productOptions = values.process ? (options.productsByProcess[values.process] ?? []) : options.products;
  const setDateFrom = (value: string) => updateQuery({ from: value || undefined });
  const setDateTo = (value: string) => updateQuery({ to: value || undefined });
  const clearFilters = () =>
    updateQuery({
      from: undefined,
      to: undefined,
      ...Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])),
    });

  // The date range counts as one filter
  const activeCount = (dateFrom || dateTo ? 1 : 0) + FILTER_KEYS.filter((key) => values[key]).length;

  return {
    query,
    filterQuery,
    updateQuery,
    options,
    productOptions,
    dateFrom,
    dateTo,
    values,
    appliedSearch,
    search,
    setSearch,
    setFilter,
    setProcess,
    setDateFrom,
    setDateTo,
    clearFilters,
    activeCount,
  };
}

export type WorkerProductionFiltersState = ReturnType<typeof useWorkerProductionFilters>;
