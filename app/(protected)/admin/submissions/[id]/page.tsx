"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SubmissionDetail, type SubmissionDetailData } from "@/components/SubmissionDetail";

type WorkComponent = { id: string; name: string };
type DefectCategory = { id: string; name: string };
type WorkCategory = { id: string; name: string };
type WorkStation = { id: string; name: string };

export default function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [submission, setSubmission] = useState<SubmissionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/submissions/${id}`).then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch("/api/categories?type=work").then((r) => r.json()) as Promise<WorkCategory[]>,
      fetch("/api/work-stations").then((r) => r.json()) as Promise<WorkStation[]>,
      fetch("/api/work-components").then((r) => r.json()) as Promise<WorkComponent[]>,
      fetch("/api/categories?type=defect").then((r) => r.json()) as Promise<DefectCategory[]>,
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
        defects: (existingDefects ?? []).map((d: { workComponentId?: string | null; categoryId?: string | null; units: number; type: string }) => ({
          workComponentName: d.workComponentId ? (compMap[d.workComponentId] ?? d.workComponentId) : null,
          defectCategoryName: d.categoryId ? (defCatMap[d.categoryId] ?? d.categoryId) : null,
          units: d.units,
          type: d.type,
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

  return (
    <SubmissionDetail
      submission={submission}
      backUrl="/admin/submissions"
      editUrl={`/admin/submissions/${id}/edit`}
    />
  );
}

