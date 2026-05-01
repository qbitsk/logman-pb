"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

type WorkProduct = { id: string; name: string; categoryId: string };
type Category = { id: string; name: string };
type WorkStation = { id: string; name: string; workProductId: string };
type WorkComponent = { id: string; name: string; workProductId: string };
type WorkDefect = { id: string; name: string; type: "unit" | "component"; workProductId: string; workComponentId: string | null };
type ExistingDefect = { workDefectId: string; units: number };

export default function EditWorkerProductionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [production, setProduction] = useState<WorkerProduction | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [workProducts, setWorkProducts] = useState<WorkProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [workDefects, setWorkDefects] = useState<WorkDefect[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/worker-productions/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const { existingDefects: defects, ...prod } = data;
        if (prod.status !== "draft" && prod.status !== "submitted") {
          router.replace(`/worker-productions/${id}`);
          return;
        }
        setProduction(prod);
        setExistingDefects(defects ?? []);
      });
  }, [id, router]);

  useEffect(() => {
    fetch("/api/work-products").then((r) => r.json()).then(setWorkProducts);
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
    fetch("/api/work-defects").then((r) => r.json()).then(setWorkDefects);
  }, []);

  useEffect(() => {
    if (production && workProducts.length && categories.length && stations.length && components.length && workDefects.length) {
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
      <Link
        href="/worker-productions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-6">Edit Production</h1>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <WorkerProductionForm
          production={{ ...production!, createdAt: new Date(production!.createdAt), updatedAt: new Date(production!.updatedAt) }}
          categories={categories}
          workProducts={workProducts}
          workStations={stations}
          workComponents={components}
          workDefects={workDefects}
          existingDefects={existingDefects}
          editUrl={`/api/worker-productions/${id}`}
          backUrl="/worker-productions"
        />
      )}
    </div>
  );
}
