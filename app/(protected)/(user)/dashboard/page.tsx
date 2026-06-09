"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, CheckCircle, Clock, ChevronRight, ArrowLeft, Box, Cog, Hammer } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

type Stats = { total: number; new: number; completed: number };
type ProductionProcess = { id: string; name: string };
type ProductionPart = { id: string; name: string; number: string | null; productionProcessId: string };

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [processes, setProcesses] = useState<ProductionProcess[]>([]);
  const [parts, setParts] = useState<ProductionPart[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProductionProcess | null>(null);

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

  const processParts = selectedProcess
    ? parts.filter((p) => p.productionProcessId === selectedProcess.id)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
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
      <div className="grid grid-cols-3 gap-4 mb-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className={`p-2 sm:p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-950 dark:text-white">
                  {stat.value ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                </p>
                <p className="text-sm hidden sm:block text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-2">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.dashboard.quickActions}</h2>

        <div className="card px-5 py-5">
          {/* Card header */}
          <div className=" border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs uppercase">
              <span className="font-semibold text-gray-700 dark:text-gray-400">{t.dashboard.newProduction}</span>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <span className="font-semibold  text-gray-500 dark:text-gray-400">
                {selectedProcess ? selectedProcess.name : t.dashboard.selectProcess}
              </span>
            </div>
            {selectedProcess && (
              <button
                type="button"
                onClick={() => setSelectedProcess(null)}
                className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t.dashboard.backToProcesses}
              </button>
            )}
          </div>

          <div className="pt-4">
            {!selectedProcess ? (
              /* Step 1 — process list */
              <>
                {processes.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.noProcesses}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {processes.map((process) => (
                      <button
                        key={process.id}
                        type="button"
                        onClick={() => setSelectedProcess(process)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer"
                      >
                        <Hammer className="w-5 h-5 text-brand-400 dark:text-brand-300 shrink-0" />
                        <span className="text-lg">{process.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Step 2 — parts for selected process */
              <>
                {processParts.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.noParts}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {processParts.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => router.push(`/worker-productions/new?partId=${part.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer text-left"
                      >
                        <Box className="w-5 h-5 text-brand-400 dark:text-brand-300 shrink-0" />
                        <span className="flex flex-col items-center">
                          <span className="font-medium text-lg">{part.name}</span>
                          {part.number && (
                            <span className="inline-block px-2 py-0 text-xs font-medium text-gray-500 dark:text-gray-400 w-fit">
                              {part.number}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

