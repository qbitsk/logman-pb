"use client";

import { useEffect, useState } from "react";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type ProductionPart = { id: string; name: string; productionProcessId: string };
type ProductionProcess = { id: string; name: string };
type ProductionStation = { id: string; name: string; productionPartId: string };
type ProductionComponent = { id: string; name: string; productionPartId: string };
type ProductionDefect = { id: string; name: string; type: "unit" | "component"; productionPartId: string; productionComponentId: string | null };

export default function NewWorkerProductionPage() {
  const [productionParts, setProductionParts] = useState<ProductionPart[]>([]);
  const [productionProcesses, setProductionProcesses] = useState<ProductionProcess[]>([]);
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [components, setComponents] = useState<ProductionComponent[]>([]);
  const [productionDefects, setProductionDefects] = useState<ProductionDefect[]>([]);
  const [loaded, setLoaded] = useState(0);
  const loading = loaded < 5;

  function done() { setLoaded((n) => n + 1); }

  useEffect(() => {
    fetch("/api/work-products").then((r) => r.json()).then(setProductionParts).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/production-processes").then((r) => r.json()).then(setProductionProcesses).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-defects").then((r) => r.json()).then(setProductionDefects).finally(done);
  }, []);

  return (
    <div>
      <Link
        href="/worker-productions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to productions
      </Link>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-1">New Production</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Fill in the form below and submit your data.</p>

      {loading ? (
        <div className="card max-w-2xl text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <div className="card max-w-2xl">
          <WorkerProductionForm
            productionProcesses={productionProcesses}
            productionParts={productionParts}
            productionStations={stations}
            productionComponents={components}
            productionDefects={productionDefects}
          />
        </div>
      )}
    </div>
  );
}
