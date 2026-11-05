"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { useTranslation, type Locale } from "@/lib/i18n";
import { workerProductionFilterQuery } from "@/lib/worker-productions/use-worker-production-filters";

export const CHART_HEIGHT = 380;

// Above this many months, value labels would collide, so they move to the tooltip.
const MAX_LABELLED_MONTHS = 12;

// Long month names fit only when there are few months; narrow screens scroll sideways.
const MAX_LONG_MONTHS = 6;
const LONG_MONTH_WIDTH = 96;
const SHORT_MONTH_WIDTH = 64;

export const axisTick = { fill: "var(--chart-axis)", fontSize: 12 };

// Value labels can land on a bar or the rate line; a surface-colored halo keeps them readable.
export const valueLabel = {
  fontSize: 12,
  fontWeight: 600,
  style: { paintOrder: "stroke", stroke: "var(--chart-surface)", strokeWidth: 3 },
};

export const tooltipCursor = { stroke: "var(--chart-axis)", strokeWidth: 1, strokeDasharray: "3 3" };

export const showValueLabels = (monthCount: number) => monthCount <= MAX_LABELLED_MONTHS;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "August", or "Aug 26" once there are many months, or a range crosses years.
export function monthLabels(months: string[], locale: Locale) {
  const long = months.length <= MAX_LONG_MONTHS;
  const crossesYears = new Set(months.map((m) => m.slice(0, 4))).size > 1;
  const format = new Intl.DateTimeFormat(locale, { month: long ? "long" : "short", timeZone: "UTC" });

  return new Map(
    months.map((key) => {
      const [year, month] = key.split("-").map(Number);
      const name = capitalize(format.format(Date.UTC(year, month - 1, 1)));
      const suffix = long ? String(year) : `'${String(year).slice(-2)}`;
      return [key, crossesYears ? `${name} ${suffix}` : name];
    }),
  );
}

export function useChartFormat() {
  const { locale } = useTranslation();
  return useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    const percent = new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return {
      number: (value: number) => number.format(value),
      percent: (value: number | null) => (value === null ? "—" : percent.format(value)),
    };
  }, [locale]);
}

// The tab's filter query plus the "Process - Part" chart title they produce.
export function useAnalyticsFilters() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  return useMemo(() => {
    const sp = new URLSearchParams(query);
    const scope = [sp.get("process"), sp.get("product")].filter(Boolean).join(" - ");
    return { query, filterQuery: workerProductionFilterQuery(sp), scope: scope || t.analytics.allProductions };
  }, [query, t]);
}

export function useAnalyticsData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setFetching(true);
    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((res: T) => {
        setData(res);
        setError(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [url]);

  return { data, fetching, error };
}

export function ChartMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="card text-center py-16">
      <p className="text-gray-400">{children}</p>
    </div>
  );
}

// Card around a chart. The inner width keeps months legible, scrolling sideways when the card is narrower.
export function ChartCard({
  title,
  scope,
  partNumbers,
  monthCount,
  legend,
  fetching,
  children,
}: {
  title?: string;
  scope: string;
  partNumbers: string[];
  monthCount: number;
  legend: React.ReactNode;
  fetching: boolean;
  children: React.ReactNode;
}) {
  const minWidth = monthCount * (monthCount <= MAX_LONG_MONTHS ? LONG_MONTH_WIDTH : SHORT_MONTH_WIDTH);
  return (
    <div className={clsx("card p-4 sm:p-6 transition-opacity", fetching && "opacity-60")}>
      <div className="text-center mb-4">
        {title && <p className="font-semibold text-gray-700 dark:text-gray-200">{title}</p>}
        <p className={clsx(title ? "text-sm text-gray-500 dark:text-gray-400" : "font-semibold text-gray-700 dark:text-gray-200")}>
          {scope}
          {partNumbers.map((number) => (
            <span key={number} className="ml-2 inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              {number}
            </span>
          ))}
        </p>
      </div>
      <div className="overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth }}>{children}</div>
      </div>
      {legend}
    </div>
  );
}

export type LegendItem = { label: string; color: string; kind?: "bar" | "line" };

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-4 text-xs font-medium text-gray-600 dark:text-gray-300">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className={clsx("shrink-0 rounded-xs", item.kind === "line" ? "w-4 h-0.5" : "w-3 h-3")}
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function ChartTooltip({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-72 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{title}</p>
      <dl className="flex flex-col gap-1">{children}</dl>
    </div>
  );
}

export function ChartTooltipRow({ label, value, color, muted }: { label: string; value: string; color?: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={clsx("flex min-w-0 items-center gap-1.5", muted ? "pl-4 text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-300")}>
        {color && <span className="w-2.5 h-2.5 shrink-0 rounded-xs" style={{ backgroundColor: color }} />}
        <span className="truncate">{label}</span>
      </dt>
      <dd className={clsx("font-medium tabular-nums", muted ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100")}>{value}</dd>
    </div>
  );
}

export const tableHeadClass = "text-left text-xs whitespace-nowrap text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700";
export const tableFootClass = "font-semibold text-gray-800 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700";
