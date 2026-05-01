"use client";

import { useEffect, useState } from "react";
import { WorkerProductionForm } from "@/components/forms/WorkerProductionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type WorkProduct = { id: string; name: string; categoryId: string };
type Category = { id: string; name: string };
type WorkStation = { id: string; name: string; workProductId: string };
type WorkComponent = { id: string; name: string; workProductId: string };
type WorkDefect = { id: string; name: string; type: "unit" | "component"; workProductId: string; workComponentId: string | null };

export default function NewWorkerProductionPage() {
  const [workProducts, setWorkProducts] = useState<WorkProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [workDefects, setWorkDefects] = useState<WorkDefect[]>([]);
  const [loaded, setLoaded] = useState(0);
  const loading = loaded < 5;

  function done() { setLoaded((n) => n + 1); }

  useEffect(() => {
    fetch("/api/work-products").then((r) => r.json()).then(setWorkProducts).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/categories?type=product").then((r) => r.json()).then(setCategories).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-defects").then((r) => r.json()).then(setWorkDefects).finally(done);
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
            categories={categories}
            workProducts={workProducts}
            workStations={stations}
            workComponents={components}
            workDefects={workDefects}
          />
        </div>
      )}
    </div>
  );
}
