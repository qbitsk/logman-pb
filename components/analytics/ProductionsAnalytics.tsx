"use client";

import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "@/lib/i18n";
import type { MonthlyProductions } from "@/lib/worker-productions/analytics";
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

type Row = MonthlyProductions["months"][number] & { label: string };

const OK_COLOR = "var(--chart-ok)";
const NOK_COLOR = "var(--chart-nok)";
const RATE_COLOR = "var(--chart-rate)";

export function ProductionsAnalytics() {
  const { t, locale } = useTranslation();
  const format = useChartFormat();
  const { filterQuery, scope } = useAnalyticsFilters();
  const { data, fetching, error } = useAnalyticsData<MonthlyProductions>(`/api/admin/analytics/productions?${filterQuery}`);

  if (error) return <ChartMessage>{t.common.failedToLoad}</ChartMessage>;
  if (!data) return <ChartMessage>{t.common.loading}</ChartMessage>;
  if (data.totals.ok === 0 && data.totals.nok === 0) return <ChartMessage>{t.analytics.noData}</ChartMessage>;

  const labels = monthLabels(data.months.map((m) => m.month), locale);
  const rows: Row[] = data.months.map((m) => ({ ...m, label: labels.get(m.month) ?? m.month }));
  const withLabels = showValueLabels(rows.length);
  const units = (value: unknown) => (typeof value === "number" && value > 0 ? format.number(value) : "");
  const rate = (value: unknown) => (typeof value === "number" ? format.percent(value) : "");

  return (
    <div className="flex flex-col gap-4">
      <ChartCard
        scope={scope}
        partNumbers={data.partNumbers}
        monthCount={rows.length}
        fetching={fetching}
        legend={
          <ChartLegend
            items={[
              { label: t.analytics.okParts, color: OK_COLOR },
              { label: t.analytics.nokParts, color: NOK_COLOR },
              { label: t.analytics.scrapRate, color: RATE_COLOR, kind: "line" },
            ]}
          />
        }
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart data={rows} margin={{ top: 24, right: 8, bottom: 0, left: 8 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="label" interval={0} tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} />
            <YAxis
              yAxisId="units"
              width={72}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => format.number(value)}
              label={{ value: t.analytics.partsAxis, angle: -90, position: "insideLeft", style: { ...axisTick, textAnchor: "middle" } }}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              width={72}
              domain={[0, "auto"]}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => format.percent(value)}
              label={{ value: t.analytics.scrapRateAxis, angle: 90, position: "insideRight", style: { ...axisTick, textAnchor: "middle" } }}
            />
            <Tooltip
              cursor={tooltipCursor}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Row | undefined;
                if (!active || !row) return null;
                return (
                  <ChartTooltip title={row.label}>
                    <ChartTooltipRow label={t.analytics.okParts} value={format.number(row.ok)} color={OK_COLOR} />
                    <ChartTooltipRow label={t.analytics.nokParts} value={format.number(row.nok)} color={NOK_COLOR} />
                    <ChartTooltipRow label={t.analytics.scrapRate} value={format.percent(row.scrapRate)} color={RATE_COLOR} />
                  </ChartTooltip>
                );
              }}
            />
            <Bar yAxisId="units" dataKey="ok" fill={OK_COLOR} maxBarSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {withLabels && <LabelList dataKey="ok" position="top" formatter={units} fill="var(--chart-ok-text)" {...valueLabel} />}
            </Bar>
            {/* NOK is usually thousands of times smaller than OK: keep it visible as a sliver */}
            <Bar
              yAxisId="units"
              dataKey="nok"
              fill={NOK_COLOR}
              maxBarSize={40}
              minPointSize={(value) => (Number(value) > 0 ? 2 : 0)}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {withLabels && <LabelList dataKey="nok" position="top" formatter={units} fill="var(--chart-nok-text)" {...valueLabel} />}
            </Bar>
            <Line
              yAxisId="rate"
              dataKey="scrapRate"
              stroke={RATE_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: RATE_COLOR, stroke: "var(--chart-surface)", strokeWidth: 1 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            >
              {withLabels && <LabelList dataKey="scrapRate" position="top" formatter={rate} fill="var(--chart-rate-text)" {...valueLabel} />}
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="card p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={tableHeadClass}>
              <th className="py-2 pe-4 font-semibold">{t.analytics.month}</th>
              <th className="py-2 px-4 font-semibold text-end">{t.analytics.okParts}</th>
              <th className="py-2 px-4 font-semibold text-end">{t.analytics.nokParts}</th>
              <th className="py-2 ps-4 font-semibold text-end">{t.analytics.scrapRate}</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 dark:text-gray-300">
            {rows
              .filter((row) => row.ok > 0 || row.nok > 0)
              .map((row) => (
                <tr key={row.month} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-2 pe-4 whitespace-nowrap">{row.label}</td>
                  <td className="py-2 px-4 text-end tabular-nums">{format.number(row.ok)}</td>
                  <td className="py-2 px-4 text-end tabular-nums">{format.number(row.nok)}</td>
                  <td className="py-2 ps-4 text-end tabular-nums">{format.percent(row.scrapRate)}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className={tableFootClass}>
              <td className="py-2 pe-4">{t.analytics.total}</td>
              <td className="py-2 px-4 text-end tabular-nums">{format.number(data.totals.ok)}</td>
              <td className="py-2 px-4 text-end tabular-nums">{format.number(data.totals.nok)}</td>
              <td className="py-2 ps-4 text-end tabular-nums">{format.percent(data.totals.scrapRate)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
