"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export type WorkerProductionDetailData = {
  id: string;
  status: string;
  units: number | null;
  shift: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  productionPartName: string | null;
  productionProcessName: string | null;
  stationName: string | null;
  defects: { workDefectName?: string | null; workDefectType?: string | null; workComponentName?: string | null; units: number }[];
  userName?: string;
  userEmail?: string;
};

type Props = {
  production: WorkerProductionDetailData;
  backUrl: string;
  editUrl?: string;
};

const statusStyles: Record<string, string> = {
  new:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function WorkerProductionDetail({ production, backUrl, editUrl }: Props) {
  const { t } = useTranslation();
  const defectedComponents = production.defects.filter((d) => d.workDefectType === "component").reduce((sum, d) => sum + d.units, 0);
  const defectedProducts = production.defects.filter((d) => d.workDefectType === "unit").reduce((sum, d) => sum + d.units, 0);
  const wasUpdated = new Date(production.updatedAt) > new Date(production.createdAt);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.common.back}
        </Link>
        {editUrl && (
          <Link
            href={editUrl}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            {t.common.edit}
          </Link>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 mt-2">
          <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[production.status])}>
            {t.status[production.status as keyof typeof t.status] ?? production.status}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {new Date(production.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 text-sm">
          {production.productionProcessName && (
            <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.process}</dt>
              <dd className="text-gray-700 dark:text-gray-300 capitalize">{production.productionProcessName}</dd>
            </div>
          )}

          <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.part}</dt>
            <dd className="text-gray-700 dark:text-gray-300 capitalize">{production.productionPartName}</dd>
          </div>

          {production.stationName && (
            <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.station}</dt>
              <dd className="text-gray-700 dark:text-gray-300 capitalize">{production.stationName}</dd>
            </div>
          )}

          {production.shift != null && (
            <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.shift}</dt>
              <dd className="text-gray-700 dark:text-gray-300">{production.shift}</dd>
            </div>
          )}

          {production.units != null && (
            <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.okParts}</dt>
              <dd className="text-emerald-600 font-medium">{production.units}</dd>
            </div>
          )}

          {production.units != null && production.defects.length > 0 && (
            <>
              <div>
                <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.defectedParts}</dt>
                <dd className="text-red-600 font-medium">{defectedProducts}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.defectedComponents}</dt>
                <dd className="text-red-500 font-medium">{defectedComponents}</dd>
              </div>
            </>
          )}

          {production.userName && (
            <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.user}</dt>
              <dd className="text-gray-700 dark:text-gray-300">{production.userName}</dd>
            </div>
          )}

          <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.submitted}</dt>
            <dd className="text-gray-500 dark:text-gray-400">{new Date(production.createdAt).toLocaleString()}</dd>
          </div>

          {wasUpdated && (
            <div>
              <dt className="text-xs text-gray-400 dark:text-gray-500">{t.workerProductionDetail.lastUpdated}</dt>
              <dd className="text-gray-500 dark:text-gray-400">{new Date(production.updatedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>

        {production.notes && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t.workerProductionDetail.notes}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{production.notes}</p>
          </div>
        )}

        {production.defects.length > 0 && (

          <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>{t.workerProductionDetail.defect}</span>
                <span>{t.workerProductionDetail.component}</span>
                <span className="text-right">{t.workerProductionDetail.units}</span>
              </div>
              {production.defects.map((d, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                  <span>{d.workDefectName ?? "—"}</span>
                  <span>{d.workComponentName ?? "—"}</span>
                  <span className="text-right font-medium">{d.units}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
