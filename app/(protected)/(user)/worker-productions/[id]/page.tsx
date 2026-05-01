"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkerProductionDetail, type WorkerProductionDetailData } from "@/components/WorkerProductionDetail";

export default function UserWorkerProductionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [production, setProduction] = useState<WorkerProductionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/worker-productions/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setProduction(data); })
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
      backUrl="/worker-productions"
      editUrl={(production.status === "draft" || production.status === "submitted") ? `/worker-productions/${id}/edit` : undefined}
    />
  );
}
