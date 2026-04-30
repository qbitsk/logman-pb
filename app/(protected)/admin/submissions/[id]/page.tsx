"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, Pencil } from "lucide-react";

type Defect = { workComponentName: string; defectCategoryName: string; units: number };

type Submission = {
  id: string;
  status: string;
  units: number | null;
  shift: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  existingDefects: { workComponentId: string; workComponentDefectCategoryId: string; units: number }[];
};

type WorkComponent = { id: string; name: string };
type DefectCategory = { id: string; name: string };
type WorkCategory = { id: string; name: string };
type WorkStation = { id: string; name: string };

// extended submission type includes resolved names
type ResolvedSubmission = Omit<Submission, "existingDefects"> & {
  categoryName: string | null;
  stationName: string | null;
  defects: Defect[];
};

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [submission, setSubmission] = useState<ResolvedSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/submissions/${id}`).then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch("/api/work-categories").then((r) => r.json()) as Promise<WorkCategory[]>,
      fetch("/api/work-stations").then((r) => r.json()) as Promise<WorkStation[]>,
      fetch("/api/work-components").then((r) => r.json()) as Promise<WorkComponent[]>,
      fetch("/api/work-component-defect-categories").then((r) => r.json()) as Promise<DefectCategory[]>,
    ]).then(([data, cats, stations, components, defCats]) => {
      if (!data) return;
      const catMap = Object.fromEntries((cats as WorkCategory[]).map((c) => [c.id, c.name]));
      const stationMap = Object.fromEntries((stations as WorkStation[]).map((s) => [s.id, s.name]));
      const compMap = Object.fromEntries((components as WorkComponent[]).map((c) => [c.id, c.name]));
      const defCatMap = Object.fromEntries((defCats as DefectCategory[]).map((d) => [d.id, d.name]));

      const { existingDefects, workCategoryId, workStationId, ...rest } = data;
      setSubmission({
        ...rest,
        categoryName: catMap[workCategoryId] ?? null,
        stationName: workStationId ? (stationMap[workStationId] ?? null) : null,
        defects: (existingDefects ?? []).map((d: { workComponentId: string; workComponentDefectCategoryId: string; units: number }) => ({
          workComponentName: compMap[d.workComponentId] ?? d.workComponentId,
          defectCategoryName: defCatMap[d.workComponentDefectCategoryId] ?? d.workComponentDefectCategoryId,
          units: d.units,
        })),
      });
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (notFound || !submission) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">Submission not found.</p>
      </div>
    );
  }

  const defectedUnits = submission.defects.reduce((sum, d) => sum + d.units, 0);
  const goodUnits = submission.units != null ? submission.units - defectedUnits : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
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
        <div>
          <p className="label">User</p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{submission.userName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{submission.userEmail}</p>
        </div>

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

