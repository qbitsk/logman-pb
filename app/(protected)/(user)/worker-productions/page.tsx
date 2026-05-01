"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { DeleteWorkerProductionButton } from "@/components/DeleteWorkerProductionButton";
import { clsx } from "clsx";

type WorkerProduction = {
  id: string;
  status: string;
  units: number | null;
  createdAt: string;
  workProductName: string;
  categoryName: string;
};

const statusStyles: Record<string, string> = {
  new:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function WorkerProductionsPage() {
  const [productions, setProductions] = useState<WorkerProduction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/worker-productions")
      .then((r) => r.json())
      .then(setProductions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">My Productions</h1>
        <Link href="/worker-productions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Production
        </Link>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : productions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">No productions yet.</p>
          <Link href="/worker-productions/new" className="btn-primary inline-flex">
            Create your first production
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Units</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {productions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 dark:border-gray-700/50 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-5 py-3 text-gray-400 dark:text-gray-500">
                    <Link href={`/worker-productions/${s.id}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 capitalize">{s.categoryName}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 capitalize">{s.workProductName}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.units ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {s.status === "new" && (
                        <Link href={`/worker-productions/${s.id}/edit`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors" aria-label="Edit production">
                          <Pencil className="w-4 h-4" />
                        </Link>
                      )}
                      {s.status === "new" && (
                        <DeleteWorkerProductionButton id={s.id} apiPath="/api/worker-productions" onDeleted={(id) => setProductions((prev) => prev.filter((x) => x.id !== id))} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
