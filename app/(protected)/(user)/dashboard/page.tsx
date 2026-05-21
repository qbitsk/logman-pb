"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import Link from "next/link";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type Stats = { total: number; new: number; completed: number };
type ProductionProcess = { id: string; name: string };
type ProductionPart = { id: string; name: string; productionProcessId: string };

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [parts, setParts] = useState<ProductionPart[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/production-processes")
      .then((r) => r.json())
      .then(setProcesses);
    fetch("/api/production-parts")
      .then((r) => r.json())
      .then(setParts);
  }, []);

  const statCards = [
    { label: t.dashboard.total, value: stats?.total, icon: FileText, color: "text-brand-600 bg-brand-50 dark:bg-brand-900/20" },
    { label: t.dashboard.new, value: stats?.new, icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    { label: t.dashboard.completed, value: stats?.completed, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-950 dark:text-white">
            {t.dashboard.hello}, {session?.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.dashboard.overview}</p>
        </div>
        <Link href="/worker-productions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t.dashboard.newProduction}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-950 dark:text-white">
                  {stat.value ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-2">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.dashboard.quickActions}</h2>
        {processes.length > 0 ? (
          <div className="columns-2xs gap-4">
            {processes.map((process) => {
              const processParts = parts.filter((p) => p.productionProcessId === process.id);
              if (processParts.length === 0) return null;
              return (
                <div key={process.id} className="pb-4 break-inside-avoid" >
                  <div className="card px-4 py-2">
                    <div className="py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {process.name}
                      </p>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {processParts.map((part) => (
                        <Link
                          key={part.id}
                          href={`/worker-productions/new?partId=${part.id}`}
                          className="flex items-center py-3 transition-colors group"
                        >
                          <Plus className="w-4 h-4 me-2.5 text-brand-400 dark:text-brand-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-700 dark:group-hover:text-brand-300">{part.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card flex flex-wrap gap-3">
            <Link href="/worker-productions/new" className="btn-primary">
              {t.dashboard.newProductionBtn}
            </Link>
            <Link href="/worker-productions" className="btn-secondary">
              {t.dashboard.viewAllProductions}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

