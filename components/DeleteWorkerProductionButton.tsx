"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

export function DeleteWorkerProductionButton({
  id,
  apiPath,
  onDeleted,
}: {
  id: string;
  apiPath: string;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  async function handleDelete() {
    if (!confirm(t.deleteConfirm)) return;
    const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      if (onDeleted) {
        onDeleted(id);
      } else {
        router.refresh();
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
      aria-label={t.workerProductions.deleteProduction}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
