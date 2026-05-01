"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";

type WorkerProduction = {
  id: string;
  workProductId: string;
  workStationId: string | null;
  units: number | null;
  shift: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
};

type WorkProduct = { id: string; name: string };
type WorkStation = { id: string; name: string; workProductId: string };
type WorkComponent = { id: string; name: string; workProductId: string };
type WorkDefect = { id: string; name: string; type: "unit" | "component"; workProductId: string; workComponentId: string | null };
type ExistingDefect = { workDefectId: string; units: number };

export default function AdminWorkerProductionEditPage() {
  const { id } = useParams<{ id: string }>();

  const [production, setProduction] = useState<WorkerProduction | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [workProducts, setWorkProducts] = useState<WorkProduct[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [workDefects, setWorkDefects] = useState<WorkDefect[]>([]);
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
        const { existingDefects: defects, ...prod } = data;
        setProduction(prod);
        setExistingDefects(defects ?? []);
      });
  }, [id]);

  useEffect(() => {
    fetch("/api/work-products").then((r) => r.json()).then(setWorkProducts);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents);
  }, []);

  useEffect(() => {
    fetch("/api/work-defects").then((r) => r.json()).then(setWorkDefects);
  }, []);

  useEffect(() => {
    if (production && workProducts.length && stations.length && components.length && workDefects.length) {
      setLoading(false);
    }
  }, [production, workProducts, stations, components, workDefects]);

  if (notFound) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">Production not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">Edit Production</h1>
        {production && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">#{production.id}</p>}
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <WorkerProductionForm
          production={{ ...production!, createdAt: new Date(production!.createdAt), updatedAt: new Date(production!.updatedAt) }}
          workProducts={workProducts}
          workStations={stations}
          workComponents={components}
          workDefects={workDefects}
          existingDefects={existingDefects}
          backUrl="/admin/worker-productions"
          allowStatusChange
        />
      )}
    </div>
  );
}
