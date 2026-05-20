"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

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

export default function EditWorkerProductionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [production, setProduction] = useState<WorkerProduction | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [productionParts, setProductionParts] = useState<ProductionPart[]>([]);
  const [productionProcesses, setProductionProcesses] = useState<ProductionProcess[]>([]);
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [components, setComponents] = useState<ProductionComponent[]>([]);
  const [productionDefects, setProductionDefects] = useState<ProductionDefect[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const markLoaded = () => setLoadedCount((c) => c + 1);

  useEffect(() => {
    fetch(`/api/worker-productions/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const { existingDefects: defects, ...prod } = data;
        if (prod.status !== "new") {
          router.replace(`/worker-productions/${id}`);
          return;
        }
        setProduction(prod);
        setExistingDefects(defects ?? []);
        markLoaded();
      });
  }, [id, router]);

  useEffect(() => {
    fetch("/api/production-parts").then((r) => r.json()).then((d) => { setProductionParts(d); markLoaded(); });
  }, []);

  useEffect(() => {
    fetch("/api/production-processes").then((r) => r.json()).then((d) => { setProductionProcesses(d); markLoaded(); });
  }, []);

  useEffect(() => {
    fetch("/api/production-stations").then((r) => r.json()).then((d) => { setStations(d); markLoaded(); });
  }, []);

  useEffect(() => {
    fetch("/api/production-components").then((r) => r.json()).then((d) => { setComponents(d); markLoaded(); });
  }, []);

  useEffect(() => {
    fetch("/api/production-defects").then((r) => r.json()).then((d) => { setProductionDefects(d); markLoaded(); });
  }, []);

  useEffect(() => {
    if (loadedCount >= 6) setLoading(false);
  }, [loadedCount]);

  if (notFound) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">{t.workerProductionDetail.notFound}</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/worker-productions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.common.back}
      </Link>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-6">{t.workerProductionForm.editTitle}</h1>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">{t.common.loading}</p>
        </div>
      ) : (
        <WorkerProductionForm
          production={{ ...production!, createdAt: new Date(production!.createdAt), updatedAt: new Date(production!.updatedAt) }}
          productionProcesses={productionProcesses}
          productionParts={productionParts}
          productionStations={stations}
          productionComponents={components}
          productionDefects={productionDefects}
          existingDefects={existingDefects}
          editUrl={`/api/worker-productions/${id}`}
          backUrl="/worker-productions"
        />
      )}
    </div>
  );
}
