"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, Pencil } from "lucide-react";

export type SubmissionDetailData = {
  id: string;
  status: string;
  units: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  categoryName: string | null;
  stationName: string | null;
  defects: { workComponentName: string; defectCategoryName: string; units: number }[];
  userName?: string;
  userEmail?: string;
};

type Props = {
  submission: SubmissionDetailData;
  backUrl: string;
  editUrl?: string;
};

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export function SubmissionDetail({ submission, backUrl, editUrl }: Props) {
  const defectedUnits = submission.defects.reduce((sum, d) => sum + d.units, 0);
  const goodUnits = submission.units != null ? submission.units - defectedUnits : null;
  const wasUpdated = new Date(submission.updatedAt) > new Date(submission.createdAt);

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
          <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[submission.status])}>
            {submission.status}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {new Date(submission.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card space-y-5">
        {submission.userName && (
          <div>
            <p className="label">User</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{submission.userName}</p>
            {submission.userEmail && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{submission.userEmail}</p>
            )}
          </div>
        )}

        <div>
          <p className="label">Work Category</p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{submission.categoryName}</p>
        </div>

        {submission.stationName && (
          <div>
            <p className="label">Work Station</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{submission.stationName}</p>
          </div>
        )}

        {submission.units != null && (
          <>
            <div>
              <p className="label">Units</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{submission.units}</p>
            </div>
            {submission.defects.length > 0 && (
              <>
                <div>
                  <p className="label">Defected Units</p>
                  <p className="text-sm text-red-600 font-medium">{defectedUnits}</p>
                </div>
                <div>
                  <p className="label">Produced Units</p>
                  <p className="text-sm text-emerald-600 font-medium">{goodUnits}</p>
                </div>
              </>
            )}
          </>
        )}

        {submission.notes && (
          <div>
            <p className="label">Notes</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{submission.notes}</p>
          </div>
        )}

        <div>
          <p className="label">Submitted</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(submission.createdAt).toLocaleString()}</p>
        </div>

        {wasUpdated && (
          <div>
            <p className="label">Last updated</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(submission.updatedAt).toLocaleString()}</p>
          </div>
        )}

        {submission.defects.length > 0 && (
          <div>
            <p className="label">Defects</p>
            <div className="mt-1 divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>Component</span>
                <span>Defect Category</span>
                <span className="text-right">Units</span>
              </div>
              {submission.defects.map((d, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                  <span>{d.workComponentName}</span>
                  <span>{d.defectCategoryName}</span>
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
