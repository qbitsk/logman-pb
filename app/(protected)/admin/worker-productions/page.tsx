"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteWorkerProductionButton } from "@/components/DeleteWorkerProductionButton";
import { clsx } from "clsx";

type WorkerProduction = {
  id: string;
  workProductName: string;
  categoryName: string;
  status: string;
  units: number | null;
  createdAt: string;
  userName: string;
  userEmail: string;
};

const statusStyles: Record<string, string> = {
  new:      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  denied:   "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminWorkerProductionsPage() {
  const [rows, setRows] = useState<WorkerProduction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/worker-productions")
      .then((r) => r.json())
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">All Productions</h1>
        {!loading && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{rows.length} total</p>}
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">No productions yet.</p>
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
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">User</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 dark:border-gray-700/50 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-5 py-3 text-gray-400 dark:text-gray-500">
                    <Link href={`/admin/worker-productions/${s.id}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
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
                  <td className="px-5 py-3">
                    <span className="text-gray-900 dark:text-gray-100">{s.userName}</span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/worker-productions/${s.id}/edit`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors" aria-label="Edit production">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteWorkerProductionButton id={s.id} apiPath="/api/admin/worker-productions" onDeleted={(id) => setRows((prev) => prev.filter((x) => x.id !== id))} />
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
