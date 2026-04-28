"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ExportsPage() {
  const [loading, setLoading] = useState<"xlsx" | "csv" | null>(null);

  async function downloadExport(format: "xlsx" | "csv") {
    setLoading(format);
    try {
      const res = await fetch(`/api/exports?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submissions-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  const formats = [
    {
      id: "xlsx" as const,
      label: "Excel (.xlsx)",
      description: "Formatted spreadsheet with colour-coded rows, frozen header, and all submission data.",
      icon: FileSpreadsheet,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      id: "csv" as const,
      label: "CSV (.csv)",
      description: "Plain comma-separated file, compatible with any spreadsheet or data tool.",
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-950 mb-2">Data Exports</h1>
      <p className="text-gray-500 text-sm mb-8">
        Download all submission data. Exports include all fields and user information.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        {formats.map((format) => {
          const Icon = format.icon;
          const isLoading = loading === format.id;
          return (
            <div key={format.id} className="card flex flex-col gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${format.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{format.label}</p>
                <p className="text-sm text-gray-500 mt-1">{format.description}</p>
              </div>
              <button
                onClick={() => downloadExport(format.id)}
                disabled={loading !== null}
                className="btn-primary flex items-center gap-2 mt-auto self-start"
              >
                <Download className="w-4 h-4" />
                {isLoading ? "Generating…" : "Download"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
