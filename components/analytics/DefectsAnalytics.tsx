"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { clsx } from "clsx";
import { useTranslation } from "@/lib/i18n";
import type { DefectType, MonthlyDefects } from "@/lib/worker-productions/analytics";
import {
  axisTick,
  CHART_HEIGHT,
  ChartCard,
  ChartLegend,
  ChartMessage,
  ChartTooltip,
  ChartTooltipRow,
  monthLabels,
  showValueLabels,
  tableFootClass,
  tableHeadClass,
  tooltipCursor,
  useAnalyticsData,
  useAnalyticsFilters,
  useChartFormat,
  valueLabel,
} from "./shared";

type Series = { key: string; name: string; color: string };
type Row = { month: string; label: string; total: number; values: Record<string, number> } & Record<string, unknown>;

// The palette's eight colors are the most that stay distinguishable; past that the tail folds into "Other".
const COLOR_SLOTS = 8;
const OTHER_KEY = "other";
const OTHER_COLOR = "var(--chart-other)";
const MAX_OTHER_ROWS = 5;

function hash(text: string) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.codePointAt(0)!) >>> 0;
  return value;
}

// Colors follow the defect's name, not its rank, so filtering doesn't repaint the survivors.
// Series are stacked in slot order, and use `s<slot>` keys because Recharts reads a dataKey as a
// path: a defect name containing a dot would otherwise never resolve.
function buildSeries(names: string[]) {
  const used = new Set<number>();
  const series: Series[] = [];
  for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
    let slot = hash(name) % COLOR_SLOTS;
    while (used.has(slot)) slot = (slot + 1) % COLOR_SLOTS;
    used.add(slot);
    series.push({ key: `s${slot}`, name, color: `var(--chart-series-${slot + 1})` });
  }
  return series.sort((a, b) => a.key.localeCompare(b.key));
}

function foldDefects(data: MonthlyDefects) {
  const totals = new Map(data.defects.map((name) => [name, 0]));
  for (const month of data.months) {
    for (const [name, value] of Object.entries(month.values)) totals.set(name, (totals.get(name) ?? 0) + value);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const visibleCount = ranked.length <= COLOR_SLOTS ? ranked.length : COLOR_SLOTS - 1;
  const series = buildSeries(ranked.slice(0, visibleCount).map(([name]) => name));
  const folded = ranked.slice(visibleCount).map(([name]) => name);
  return { ranked, series, folded };
}

// The defects folded into "Other" for one month: the largest few, so the tooltip fits the chart.
function OtherBreakdown({ names, values }: { names: string[]; values: Record<string, number> }) {
  const { t } = useTranslation();
  const format = useChartFormat();
  const present = names.filter((name) => values[name]).sort((a, b) => values[b] - values[a]);
  const hidden = present.length - MAX_OTHER_ROWS;
  return (
    <>
      {present.slice(0, MAX_OTHER_ROWS).map((name) => (
        <ChartTooltipRow key={name} label={name} value={format.number(values[name])} muted />
      ))}
      {hidden > 0 && <ChartTooltipRow label={t.analytics.moreDefects(hidden)} value="" muted />}
    </>
  );
}

export function DefectsAnalytics() {
  const { t, locale } = useTranslation();
  const format = useChartFormat();
  const pathname = usePathname();
  const { query, filterQuery, scope } = useAnalyticsFilters();

  const defectType: DefectType = new URLSearchParams(query).get("defectType") === "component" ? "component" : "unit";
  const { data, fetching, error } = useAnalyticsData<MonthlyDefects>(`/api/admin/analytics/defects?${filterQuery}&defectType=${defectType}`);

  const folded = useMemo(() => (data ? foldDefects(data) : null), [data]);

  const toggleHref = (type: DefectType) => {
    const params = new URLSearchParams(query);
    if (type === "component") params.set("defectType", type);
    else params.delete("defectType");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const toggle = (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 mb-4 bg-white dark:bg-gray-900">
      {([
        ["unit", t.analytics.partDefects],
        ["component", t.analytics.componentDefects],
      ] as const).map(([type, label]) => (
        <Link
          key={type}
          href={toggleHref(type)}
          replace
          scroll={false}
          aria-current={defectType === type ? "true" : undefined}
          className={clsx(
            "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors",
            defectType === type
              ? "bg-brand-600 text-white"
              : "text-gray-600 hover:text-brand-700 dark:text-gray-400 dark:hover:text-brand-300",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );

  if (error) return <>{toggle}<ChartMessage>{t.common.failedToLoad}</ChartMessage></>;
  if (!data || !folded) return <>{toggle}<ChartMessage>{t.common.loading}</ChartMessage></>;
  if (data.defects.length === 0) return <>{toggle}<ChartMessage>{t.analytics.noData}</ChartMessage></>;

  const { ranked, series, folded: foldedNames } = folded;
  const shownNames = new Set(series.map((s) => s.name));
  const labels = monthLabels(data.months.map((m) => m.month), locale);

  const rows: Row[] = data.months.map((m) => {
    const row: Row = { month: m.month, label: labels.get(m.month) ?? m.month, total: m.total, values: m.values };
    for (const s of series) {
      if (m.values[s.name]) row[s.key] = m.values[s.name];
    }
    const other = Object.entries(m.values)
      .filter(([name]) => !shownNames.has(name))
      .reduce((sum, [, value]) => sum + value, 0);
    if (other > 0) row[OTHER_KEY] = other;
    return row;
  });

  const bars: Series[] = foldedNames.length > 0
    ? [...series, { key: OTHER_KEY, name: t.analytics.other, color: OTHER_COLOR }]
    : series;

  const monthsWithData = rows.filter((row) => row.total > 0);
  const totalAll = ranked.reduce((sum, [, total]) => sum + total, 0);

  return (
    <div>
      {toggle}
      <div className="flex flex-col gap-4">
        <ChartCard
          title={t.analytics.defectBreakdown}
          scope={scope}
          partNumbers={data.partNumbers}
          monthCount={rows.length}
          fetching={fetching}
          legend={<ChartLegend items={bars.map((s) => ({ label: s.name, color: s.color }))} />}
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <ComposedChart data={rows} margin={{ top: 24, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="label" interval={0} tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} />
              <YAxis
                width={56}
                allowDecimals={false}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => format.number(value)}
              />
              <Tooltip
                cursor={tooltipCursor}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as Row | undefined;
                  if (!active || !row || row.total === 0) return null;
                  const entries = bars
                    .filter((s) => row[s.key])
                    .sort((a, b) => Number(row[b.key]) - Number(row[a.key]));
                  return (
                    <ChartTooltip title={row.label}>
                      {entries.map((s) => (
                        <div key={s.key} className="contents">
                          <ChartTooltipRow label={s.name} value={format.number(Number(row[s.key]))} color={s.color} />
                          {s.key === OTHER_KEY && <OtherBreakdown names={foldedNames} values={row.values} />}
                        </div>
                      ))}
                      <ChartTooltipRow label={t.analytics.total} value={format.number(row.total)} />
                    </ChartTooltip>
                  );
                }}
              />
              {bars.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="defects"
                  fill={s.color}
                  stroke="var(--chart-surface)"
                  strokeWidth={1}
                  maxBarSize={56}
                  isAnimationActive={false}
                />
              ))}
              {/* Invisible line whose only job is to print each stack's total above it */}
              {showValueLabels(rows.length) && (
                <Line dataKey="total" stroke="none" dot={false} activeDot={false} legendType="none" tooltipType="none" isAnimationActive={false}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(value: unknown) => (typeof value === "number" && value > 0 ? format.number(value) : "")}
                    fill="var(--chart-text)"
                    {...valueLabel}
                  />
                </Line>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card p-4 sm:p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="py-2 pe-4 font-semibold">{t.analytics.defect}</th>
                {monthsWithData.map((row) => (
                  <th key={row.month} className="py-2 px-3 font-semibold text-end">{row.label}</th>
                ))}
                <th className="py-2 ps-3 font-semibold text-end">{t.analytics.total}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {ranked.map(([name, total]) => (
                <tr key={name} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-2 pe-4">{name}</td>
                  {monthsWithData.map((row) => (
                    <td key={row.month} className="py-2 px-3 text-end tabular-nums">
                      {row.values[name] ? format.number(row.values[name]) : "—"}
                    </td>
                  ))}
                  <td className="py-2 ps-3 text-end tabular-nums font-medium">{format.number(total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={tableFootClass}>
                <td className="py-2 pe-4">{t.analytics.total}</td>
                {monthsWithData.map((row) => (
                  <td key={row.month} className="py-2 px-3 text-end tabular-nums">{format.number(row.total)}</td>
                ))}
                <td className="py-2 ps-3 text-end tabular-nums">{format.number(totalAll)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
