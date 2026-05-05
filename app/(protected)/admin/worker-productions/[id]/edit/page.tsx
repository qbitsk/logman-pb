"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";

type WorkerProduction = {
  id: string;
  productionProductId: string;
  productionStationId: string | null;
  units: number | null;
  shift: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
};

type ProductionProduct = { id: string; name: string; categoryId: string };
type Category = { id: string; name: string };
type ProductionStation = { id: string; name: string; productionProductId: string };
type ProductionComponent = { id: string; name: string; productionProductId: string };
type ProductionDefect = { id: string; name: string; type: "unit" | "component"; productionProductId: string; productionComponentId: string | null };
type ExistingDefect = { productionDefectId: string; units: number };

export default function AdminWorkerProductionEditPage() {
  const { id } = useParams<{ id: string }>();

  const [production, setProduction] = useState<WorkerProduction | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [productionProducts, setProductionProducts] = useState<ProductionProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [components, setComponents] = useState<ProductionComponent[]>([]);
  const [productionDefects, setProductionDefects] = useState<ProductionDefect[]>([]);
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
    fetch("/api/work-products").then((r) => r.json()).then(setProductionProducts);
  }, []);

  useEffect(() => {
    fetch("/api/categories?type=product").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents);
  }, []);

  useEffect(() => {
    fetch("/api/work-defects").then((r) => r.json()).then(setProductionDefects);
  }, []);

  useEffect(() => {
    if (production && productionProducts.length && categories.length && stations.length && components.length && productionDefects.length) {
      setLoading(false);
    }
  }, [production, productionProducts, stations, components, productionDefects]);

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
          categories={categories}
          productionProducts={productionProducts}
          productionStations={stations}
          productionComponents={components}
          productionDefects={productionDefects}
          existingDefects={existingDefects}
          backUrl="/admin/worker-productions"
          allowStatusChange
        />
      )}
    </div>
  );
}
