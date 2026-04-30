"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { DeleteSubmissionButton } from "@/components/DeleteSubmissionButton";
import { clsx } from "clsx";

type Submission = {
  id: string;
  status: string;
  units: number | null;
  createdAt: string;
  categoryName: string;
};

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function SubmissionsPage() {
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => r.json())
      .then(setUserSubmissions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">My Submissions</h1>
        <Link href="/submissions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Submission
        </Link>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : userSubmissions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">No submissions yet.</p>
          <Link href="/submissions/new" className="btn-primary inline-flex">
            Create your first submission
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Units</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {userSubmissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 dark:border-gray-700/50 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-5 py-3 text-gray-400 dark:text-gray-500">
                    <Link href={`/submissions/${s.id}`} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 capitalize">
                    {s.categoryName}
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.units ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {(s.status === "draft" || s.status === "submitted") && (
                        <Link href={`/submissions/${s.id}/edit`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors" aria-label="Edit submission">
                          <Pencil className="w-4 h-4" />
                        </Link>
                      )}
                      {(s.status === "draft" || s.status === "submitted") && (
                        <DeleteSubmissionButton id={s.id} apiPath="/api/submissions" onDeleted={(id) => setUserSubmissions((prev) => prev.filter((x) => x.id !== id))} />
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
