"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { WorkerProductionFilterBar } from "@/components/worker-productions/WorkerProductionFilterBar";
import { useTranslation } from "@/lib/i18n";
import { useWorkerProductionFilters } from "@/lib/worker-productions/use-worker-production-filters";

// Lives in the layout, so the filter bar stays mounted when switching tabs. The filters
// themselves are in the URL, which is where the tab pages read them from.
export function AnalyticsShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const filters = useWorkerProductionFilters();

  const tabs = [
    { href: "/admin/analytics/productions", label: t.analytics.tabs.productions },
    { href: "/admin/analytics/defects", label: t.analytics.tabs.defects },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">{t.analytics.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.analytics.subtitle}</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={filters.query ? `${tab.href}?${filters.query}` : tab.href}
            scroll={false}
            className={clsx(
              "shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              pathname.startsWith(tab.href)
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <WorkerProductionFilterBar filters={filters} />

      {children}
    </div>
  );
}
