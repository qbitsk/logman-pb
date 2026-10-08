"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";
import { useTranslation } from "@/lib/i18n";
import { adminListHref } from "@/lib/worker-productions/admin-list-url";

type WorkerProduction = {
  id: string;
  productionPartId: string;
  productionStationId: string | null;
  units: number | null;
  shift: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
};

type ProductionPart = { id: string; name: string; productionProcessId: string };
type ProductionProcess = { id: string; name: string };
type ProductionStation = { id: string; name: string; productionPartId: string };
type ProductionComponent = { id: string; name: string; productionPartId: string };
type ProductionDefect = { id: string; name: string; type: "unit" | "component"; productionPartId: string; productionComponentId: string | null };
type ExistingDefect = { productionDefectId: string; units: number };

export default function AdminWorkerProductionEditPage() {
  const { id } = useParams<{ id: string }>();
  const listQuery = useSearchParams().get("list");
  const { t } = useTranslation();

  const [production, setProduction] = useState<WorkerProduction | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [productionParts, setProductionParts] = useState<ProductionPart[]>([]);
  const [productionProcesses, setProductionProcesses] = useState<ProductionProcess[]>([]);
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [components, setComponents] = useState<ProductionComponent[]>([]);
  const [productionDefects, setProductionDefects] = useState<ProductionDefect[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Load everything together so the form only mounts once all data is present
  // (it reads lookups in useState initializers and won't pick up later arrivals).
  useEffect(() => {
    let cancelled = false;
    const getJson = (url: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`))));

    Promise.all([
      fetch(`/api/admin/worker-productions/${id}`).then((r) =>
        r.status === 404 ? null : r.ok ? r.json() : Promise.reject(new Error(`production: ${r.status}`))
      ),
      getJson("/api/production-parts"),
      getJson("/api/production-processes"),
      getJson("/api/production-stations"),
      getJson("/api/production-components"),
      getJson("/api/production-defects"),
    ])
      .then(([data, parts, processes, stationsData, componentsData, defectsData]) => {
        if (cancelled) return;
        if (!data) { setNotFound(true); return; }
        const { existingDefects: defects, ...prod } = data;
        setProduction(prod);
        setExistingDefects(defects ?? []);
        setProductionParts(parts);
        setProductionProcesses(processes);
        setStations(stationsData);
        setComponents(componentsData);
        setProductionDefects(defectsData);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoadError(true); });

    return () => { cancelled = true; };
  }, [id]);

  if (notFound) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">{t.workerProductionDetail.notFound}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card text-center py-16">
        <p className="text-red-600 dark:text-red-400">{t.common.failedToLoad}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">{t.workerProductionForm.editTitle}</h1>
      </div>

      {loading || !production ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.common.loading}</p>
        </div>
      ) : (
        <WorkerProductionForm
          production={{ ...production, createdAt: new Date(production.createdAt), updatedAt: new Date(production.updatedAt) }}
          productionProcesses={productionProcesses}
          productionParts={productionParts}
          productionStations={stations}
          productionComponents={components}
          productionDefects={productionDefects}
          existingDefects={existingDefects}
          backUrl={adminListHref(listQuery)}
          canEditDate
        />
      )}
    </div>
  );
}
