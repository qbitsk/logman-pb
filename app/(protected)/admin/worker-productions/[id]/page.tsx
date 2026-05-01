"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkerProductionDetail, type WorkerProductionDetailData } from "@/components/WorkerProductionDetail";

export default function AdminWorkerProductionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [production, setProduction] = useState<WorkerProductionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/worker-productions/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const { existingDefects: _ignored, workProductId: _wp, workStationId: _ws, userId: _uid, ...rest } = data;
        setProduction(rest);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (notFound || !production) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">Production not found.</p>
      </div>
    );
  }

  return (
    <WorkerProductionDetail
      production={production}
      backUrl="/admin/worker-productions"
      editUrl={`/admin/worker-productions/${id}/edit`}
    />
  );
}
