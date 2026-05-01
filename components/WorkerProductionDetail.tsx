"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, Pencil } from "lucide-react";

export type WorkerProductionDetailData = {
  id: string;
  status: string;
  units: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workProductName: string | null;
  categoryName: string | null;
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
  new:      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  denied:   "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export function WorkerProductionDetail({ production, backUrl, editUrl }: Props) {
  const defectedComponents = production.defects.filter((d) => d.workDefectType === "component").reduce((sum, d) => sum + d.units, 0);
  const defectedProducts = production.defects.filter((d) => d.workDefectType === "unit").reduce((sum, d) => sum + d.units, 0);
  const wasUpdated = new Date(production.updatedAt) > new Date(production.createdAt);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        {editUrl && (
          <Link
            href={editUrl}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mt-2">
          <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[production.status])}>
            {production.status}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {new Date(production.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card space-y-5">
        {production.userName && (
          <div>
            <p className="label">User</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{production.userName}</p>
            {production.userEmail && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{production.userEmail}</p>
            )}
          </div>
        )}

        {production.categoryName && (
          <div>
            <p className="label">Category</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{production.categoryName}</p>
          </div>
        )}

        <div>
          <p className="label">Product</p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{production.workProductName}</p>
        </div>

        {production.stationName && (
          <div>
            <p className="label">Work Station</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{production.stationName}</p>
          </div>
        )}

        {production.units != null && (
          <>
            <div>
              <p className="label">Units</p>
              <p className="text-sm text-emerald-600">{production.units}</p>
            </div>
            {production.defects.length > 0 && (
              <>
                <div>
                  <p className="label">Defected Products</p>
                  <p className="text-sm text-red-600 font-medium">{defectedProducts}</p>
                </div>
                <div>
                  <p className="label">Defected Components</p>
                  <p className="text-sm text-red-500 font-medium">{defectedComponents}</p>
                </div>
              </>
            )}
          </>
        )}

        {production.notes && (
          <div>
            <p className="label">Notes</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{production.notes}</p>
          </div>
        )}

        <div>
          <p className="label">Submitted</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(production.createdAt).toLocaleString()}</p>
        </div>

        {wasUpdated && (
          <div>
            <p className="label">Last updated</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(production.updatedAt).toLocaleString()}</p>
          </div>
        )}

        {production.defects.length > 0 && (
          <div>
            <p className="label">Defects</p>
            <div className="mt-1 divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>Defect</span>
                <span>Component</span>
                <span className="text-right">Units</span>
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
