"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkerProductionDetail, type WorkerProductionDetailData } from "@/components/WorkerProductionDetail";
import { useTranslation } from "@/lib/i18n";

export default function AdminWorkerProductionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

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
        const { existingDefects: _ignored, productionPartId: _wp, productionStationId: _ws, userId: _uid, ...rest } = data;
        setProduction(rest);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">{t.common.loading}</p>
      </div>
    );
  }

  if (notFound || !production) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">{t.workerProductionDetail.notFound}</p>
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
