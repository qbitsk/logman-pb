"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

export default function ExportsPage() {
  const [loading, setLoading] = useState(false);

  async function downloadCSV() {
    setLoading(true);
    try {
      const res = await fetch(`/api/exports?format=csv`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submissions-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-2">Data Exports</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Download all submission data. Exports include all fields and user information.
      </p>

      <div className="max-w-2xl">
        <div className="card flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">CSV (.csv)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Plain comma-separated file, compatible with any spreadsheet or data tool.
            </p>
          </div>
          <button
            onClick={downloadCSV}
            disabled={loading}
            className="btn-primary flex items-center gap-2 mt-auto self-start"
          >
            <Download className="w-4 h-4" />
            {loading ? "Generating…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
