"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductionProcess = {
  id: string;
  name: string;
  createdAt: string;
};

type ProductionPart = {
  id: string;
  name: string;
  productionProcessId: string;
  productionProcessName: string;
  createdAt: string;
};

type ProductionComponent = {
  id: string;
  name: string;
  productionPartId: string;
  productionPartName: string;
  createdAt: string;
};

type ProductionDefect = {
  id: string;
  name: string;
  productionComponentId: string | null;
  componentName: string | null;
  productionPartName: string | null;
  createdAt: string;
};

type UnitDefect = {
  id: string;
  name: string;
  productionPartId: string;
  productionPartName: string | null;
  createdAt: string;
};

type ProductionStation = {
  id: string;
  name: string;
  productionPartId: string;
  productionPartName: string;
  createdAt: string;
};

type Tab = "processes" | "parts" | "components" | "defects" | "unitdefects" | "stations";

const TAB_IDS: Tab[] = ["processes", "parts", "components", "stations", "unitdefects", "defects"];

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-brand-950 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkCategoriesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("processes");
  const { error: toastError } = useToast();
  const { t } = useTranslation();

  const TABS: { id: Tab; label: string }[] = [
    { id: "processes", label: t.definitions.tabs.processes },
    { id: "parts", label: t.definitions.tabs.parts },
    { id: "components", label: t.definitions.tabs.components },
    { id: "stations", label: t.definitions.tabs.stations },
    { id: "unitdefects", label: t.definitions.tabs.unitDefects },
    { id: "defects", label: t.definitions.tabs.defects },
  ];

  // ── Production Processes state ──
  const [productionProcesses, setProductionProcesses] = useState<ProductionProcess[]>([]);
  const [processLoading, setProcessLoading] = useState(true);
  const [processModal, setProcessModal] = useState<{ open: boolean; editing: ProductionProcess | null }>({ open: false, editing: null });
  const [processForm, setProcessForm] = useState({ name: "" });
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSaving, setProcessSaving] = useState(false);

  // ── Production Parts state ──
  const [productionParts, setProductionParts] = useState<ProductionPart[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodModal, setProdModal] = useState<{ open: boolean; editing: ProductionPart | null }>({ open: false, editing: null });
  const [prodForm, setProdForm] = useState({ name: "", productionProcessId: "" });
  const [prodError, setProdError] = useState<string | null>(null);
  const [prodSaving, setProdSaving] = useState(false);

  // ── Production Components state ──
  const [components, setComponents] = useState<ProductionComponent[]>([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compModal, setCompModal] = useState<{ open: boolean; editing: ProductionComponent | null }>({ open: false, editing: null });
  const [compForm, setCompForm] = useState({ name: "", productionPartId: "" });
  const [compError, setCompError] = useState<string | null>(null);
  const [compSaving, setCompSaving] = useState(false);

  // ── Production Defects state ──
  const [defects, setDefects] = useState<ProductionDefect[]>([]);
  const [defLoading, setDefLoading] = useState(true);
  const [defModal, setDefModal] = useState<{ open: boolean; editing: ProductionDefect | null }>({ open: false, editing: null });
  const [defForm, setDefForm] = useState({ name: "", productionComponentId: "" });
  const [defError, setDefError] = useState<string | null>(null);
  const [defSaving, setDefSaving] = useState(false);

  // ── Unit Defects state ──
  const [unitDefects, setUnitDefects] = useState<UnitDefect[]>([]);
  const [unitDefLoading, setUnitDefLoading] = useState(true);
  const [unitDefModal, setUnitDefModal] = useState<{ open: boolean; editing: UnitDefect | null }>({ open: false, editing: null });
  const [unitDefForm, setUnitDefForm] = useState({ name: "", productionPartId: "" });
  const [unitDefError, setUnitDefError] = useState<string | null>(null);
  const [unitDefSaving, setUnitDefSaving] = useState(false);

  // ── Stations state ──
  const [stations, setStations] = useState<ProductionStation[]>([]);
  const [stationLoading, setStationLoading] = useState(true);
  const [stationModal, setStationModal] = useState<{ open: boolean; editing: ProductionStation | null }>({ open: false, editing: null });
  const [stationForm, setStationForm] = useState({ name: "", productionPartId: "" });
  const [stationError, setStationError] = useState<string | null>(null);
  const [stationSaving, setStationSaving] = useState(false);

  // ── Fetch ──
  useEffect(() => {
    fetch("/api/admin/production-processes")
      .then((r) => r.json())
      .then(setProductionProcesses)
      .finally(() => setProcessLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/production-parts")
      .then((r) => r.json())
      .then(setProductionParts)
      .finally(() => setProdLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/production-components")
      .then((r) => r.json())
      .then(setComponents)
      .finally(() => setCompLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/production-defects?type=component")
      .then((r) => r.json())
      .then(setDefects)
      .finally(() => setDefLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/production-defects?type=unit")
      .then((r) => r.json())
      .then((rows) =>
        setUnitDefects(
          rows.map((r: ProductionDefect & { productionPartId: string; productionPartName: string | null }) => ({
            id: r.id,
            name: r.name,
            productionPartId: r.productionPartId,
            productionPartName: r.productionPartName,
            createdAt: r.createdAt,
          }))
        )
      )
      .finally(() => setUnitDefLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/production-stations")
      .then((r) => r.json())
      .then(setStations)
      .finally(() => setStationLoading(false));
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Production Processes handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openProcessCreate() {
    setProcessForm({ name: "" });
    setProcessError(null);
    setProcessModal({ open: true, editing: null });
  }

  function openProcessEdit(process: ProductionProcess) {
    setProcessForm({ name: process.name });
    setProcessError(null);
    setProcessModal({ open: true, editing: process });
  }

  async function submitProcess(e: React.FormEvent) {
    e.preventDefault();
    setProcessError(null);
    setProcessSaving(true);

    const isEdit = !!processModal.editing;
    const url = isEdit
      ? `/api/admin/production-processes/${processModal.editing!.id}`
      : "/api/admin/production-processes";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processForm),
    });

    if (res.ok) {
      const saved: ProductionProcess = await res.json();
      setProductionProcesses((prev) =>
        isEdit ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
      );
      setProcessModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setProcessError(err?.error ?? "Failed to save");
    }
    setProcessSaving(false);
  }

  async function deleteProcess(id: string) {
    if (!confirm(t.definitions.deleteProcessConfirm)) return;
    const res = await fetch(`/api/admin/production-processes/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setProductionProcesses((prev) => prev.filter((p) => p.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      toastError(err?.error ?? t.common.failedToDelete);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Work Products handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openProdCreate() {
    setProdForm({ name: "", productionProcessId: productionProcesses[0]?.id ?? "" });
    setProdError(null);
    setProdModal({ open: true, editing: null });
  }

  function openProdEdit(prod: ProductionPart) {
    setProdForm({ name: prod.name, productionProcessId: prod.productionProcessId });
    setProdError(null);
    setProdModal({ open: true, editing: prod });
  }

  async function submitProd(e: React.FormEvent) {
    e.preventDefault();
    setProdError(null);
    setProdSaving(true);

    const isEdit = !!prodModal.editing;
    const url = isEdit
      ? `/api/admin/production-parts/${prodModal.editing!.id}`
      : "/api/admin/production-parts";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prodForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const processName = productionProcesses.find((p) => p.id === saved.productionProcessId)?.name ?? "";
      const enriched: ProductionPart = { ...saved, productionProcessName: processName };
      setProductionParts((prev) =>
        isEdit ? prev.map((p) => (p.id === enriched.id ? enriched : p)) : [...prev, enriched]
      );
      setProdModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setProdError(err?.error ?? "Failed to save");
    }
    setProdSaving(false);
  }

  async function deleteProd(id: string) {
    if (!confirm(t.definitions.deletePartConfirm)) return;
    const res = await fetch(`/api/admin/production-parts/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setProductionParts((prev) => prev.filter((p) => p.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      toastError(err?.error ?? t.common.failedToDelete);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Work Components handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openCompCreate() {
    setCompForm({ name: "", productionPartId: productionParts[0]?.id ?? "" });
    setCompError(null);
    setCompModal({ open: true, editing: null });
  }

  function openCompEdit(comp: ProductionComponent) {
    setCompForm({ name: comp.name, productionPartId: comp.productionPartId });
    setCompError(null);
    setCompModal({ open: true, editing: comp });
  }

  async function submitComp(e: React.FormEvent) {
    e.preventDefault();
    setCompError(null);
    setCompSaving(true);

    const isEdit = !!compModal.editing;
    const url = isEdit
      ? `/api/admin/production-components/${compModal.editing!.id}`
      : "/api/admin/production-components";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const productName = productionParts.find((p) => p.id === saved.productionPartId)?.name ?? "";
      const enriched: ProductionComponent = { ...saved, productionPartName: productName };
      setComponents((prev) =>
        isEdit ? prev.map((c) => (c.id === enriched.id ? enriched : c)) : [...prev, enriched]
      );
      setCompModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setCompError(err?.error ?? "Failed to save");
    }
    setCompSaving(false);
  }

  async function deleteComp(id: string) {
    if (!confirm(t.definitions.deleteComponentConfirm)) return;
    const res = await fetch(`/api/admin/production-components/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setComponents((prev) => prev.filter((c) => c.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      toastError(err?.error ?? t.common.failedToDelete);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Defect Categories handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openDefCreate() {
    setDefForm({ name: "", productionComponentId: components[0]?.id ?? "" });
    setDefError(null);
    setDefModal({ open: true, editing: null });
  }

  function openDefEdit(def: ProductionDefect) {
    setDefForm({ name: def.name, productionComponentId: def.productionComponentId ?? "" });
    setDefError(null);
    setDefModal({ open: true, editing: def });
  }

  async function submitDef(e: React.FormEvent) {
    e.preventDefault();
    setDefError(null);
    setDefSaving(true);

    const isEdit = !!defModal.editing;
    const url = isEdit
      ? `/api/admin/production-defects/${defModal.editing!.id}`
      : "/api/admin/production-defects";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const compName = components.find((c) => c.id === saved.productionComponentId)?.name ?? null;
      const productName = components.find((c) => c.id === saved.productionComponentId)?.productionPartName ?? null;
      const enriched: ProductionDefect = { ...saved, componentName: compName, productionPartName: productName };
      setDefects((prev) =>
        isEdit ? prev.map((d) => (d.id === enriched.id ? enriched : d)) : [...prev, enriched]
      );
      setDefModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setDefError(err?.error ?? "Failed to save");
    }
    setDefSaving(false);
  }

  async function deleteDef(id: string) {
    if (!confirm(t.definitions.deleteDefectConfirm)) return;
    const res = await fetch(`/api/admin/production-defects/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setDefects((prev) => prev.filter((d) => d.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      toastError(err?.error ?? t.common.failedToDelete);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Unit Defects handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openUnitDefCreate() {
    setUnitDefForm({ name: "", productionPartId: productionParts[0]?.id ?? "" });
    setUnitDefError(null);
    setUnitDefModal({ open: true, editing: null });
  }

  function openUnitDefEdit(def: UnitDefect) {
    setUnitDefForm({ name: def.name, productionPartId: def.productionPartId });
    setUnitDefError(null);
    setUnitDefModal({ open: true, editing: def });
  }

  async function submitUnitDef(e: React.FormEvent) {
    e.preventDefault();
    setUnitDefError(null);
    setUnitDefSaving(true);

    const isEdit = !!unitDefModal.editing;
    const url = isEdit
      ? `/api/admin/production-defects/${unitDefModal.editing!.id}`
      : "/api/admin/production-defects";

    const payload = isEdit
      ? { name: unitDefForm.name, productionPartId: unitDefForm.productionPartId }
      : { name: unitDefForm.name, productionPartId: unitDefForm.productionPartId, type: "unit" };

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      const productName = productionParts.find((p) => p.id === saved.productionPartId)?.name ?? null;
      const enriched: UnitDefect = {
        id: saved.id,
        name: saved.name,
        productionPartId: saved.productionPartId,
        productionPartName: productName,
        createdAt: saved.createdAt,
      };
      setUnitDefects((prev) =>
        isEdit ? prev.map((d) => (d.id === enriched.id ? enriched : d)) : [...prev, enriched]
      );
      setUnitDefModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setUnitDefError(err?.error ?? "Failed to save");
    }
    setUnitDefSaving(false);
  }

  async function deleteUnitDef(id: string) {
    if (!confirm(t.definitions.deleteUnitDefectConfirm)) return;
    const res = await fetch(`/api/admin/production-defects/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setUnitDefects((prev) => prev.filter((d) => d.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      toastError(err?.error ?? t.common.failedToDelete);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stations handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openStationCreate() {
    setStationForm({ name: "", productionPartId: productionParts[0]?.id ?? "" });
    setStationError(null);
    setStationModal({ open: true, editing: null });
  }

  function openStationEdit(station: ProductionStation) {
    setStationForm({ name: station.name, productionPartId: station.productionPartId });
    setStationError(null);
    setStationModal({ open: true, editing: station });
  }

  async function submitStation(e: React.FormEvent) {
    e.preventDefault();
    setStationError(null);
    setStationSaving(true);

    const isEdit = !!stationModal.editing;
    const url = isEdit
      ? `/api/admin/production-stations/${stationModal.editing!.id}`
      : "/api/admin/production-stations";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stationForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const productName = productionParts.find((p) => p.id === saved.productionPartId)?.name ?? "";
      const enriched: ProductionStation = { ...saved, productionPartName: productName };
      setStations((prev) =>
        isEdit ? prev.map((s) => (s.id === enriched.id ? enriched : s)) : [...prev, enriched]
      );
      setStationModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setStationError(err?.error ?? "Failed to save");
    }
    setStationSaving(false);
  }

  async function deleteStation(id: string) {
    if (!confirm(t.definitions.deleteStationConfirm)) return;
    const res = await fetch(`/api/admin/production-stations/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setStations((prev) => prev.filter((s) => s.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      toastError(err?.error ?? t.common.failedToDelete);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950  dark:text-white">{t.definitions.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.definitions.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "shrink-0 px-3 py-2.5 text-xs sm:px-4 sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Processes tab ── */}
      {activeTab === "processes" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.definitions.countProcesses(productionProcesses.length)}</span>
            <button onClick={openProcessCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t.definitions.addProcess}
            </button>
          </div>
          {processLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.common.loading}</div>
          ) : productionProcesses.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.definitions.noProcesses}</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.common.name}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {productionProcesses.map((process) => (
                    <tr key={process.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{process.name}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openProcessEdit(process)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteProcess(process.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Work Parts tab ── */}
      {activeTab === "parts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.definitions.countParts(productionParts.length)}</span>
            <button onClick={openProdCreate} className="btn-primary flex items-center gap-2" disabled={productionProcesses.length === 0}>
              <Plus className="w-4 h-4" />
              {t.definitions.addPart}
            </button>
          </div>
          {prodLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.common.loading}</div>
          ) : productionParts.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.definitions.noParts}</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.common.name}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductions.process}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {productionParts.map((prod) => (
                    <tr key={prod.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{prod.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{prod.productionProcessName}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openProdEdit(prod)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteProd(prod.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Work Components tab ── */}
      {activeTab === "components" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.definitions.countComponents(components.length)}</span>
            <button onClick={openCompCreate} className="btn-primary flex items-center gap-2" disabled={productionParts.length === 0}>
              <Plus className="w-4 h-4" />
              {t.definitions.addComponent}
            </button>
          </div>
          {compLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.common.loading}</div>
          ) : components.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.definitions.noComponents}</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.common.name}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductions.process}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductionDetail.part}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp) => (
                    <tr key={comp.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{comp.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{productionParts.find((p) => p.id === comp.productionPartId)?.productionProcessName ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{comp.productionPartName}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openCompEdit(comp)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteComp(comp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Defect Categories tab ── */}
      {activeTab === "defects" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.definitions.countDefects(defects.length)}</span>
            <button onClick={openDefCreate} className="btn-primary flex items-center gap-2" disabled={components.length === 0}>
              <Plus className="w-4 h-4" />
              {t.definitions.addDefect}
            </button>
          </div>
          {defLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.common.loading}</div>
          ) : defects.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.definitions.noDefects}</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.common.name}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductions.process}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductionDetail.part}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductionDetail.component}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {defects.map((def) => (
                    <tr key={def.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{def.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{(() => { const comp = components.find((c) => c.id === def.productionComponentId); return comp ? (productionParts.find((p) => p.id === comp.productionPartId)?.productionProcessName ?? "—") : "—"; })()}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{def.productionPartName ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{def.componentName ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDefEdit(def)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteDef(def.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Stations tab ── */}
      {activeTab === "stations" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.definitions.countStations(stations.length)}</span>
            <button onClick={openStationCreate} className="btn-primary flex items-center gap-2" disabled={productionParts.length === 0}>
              <Plus className="w-4 h-4" />
              {t.definitions.addStation}
            </button>
          </div>
          {stationLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.common.loading}</div>
          ) : stations.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.definitions.noStations}</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.common.name}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductions.process}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductionDetail.part}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => (
                    <tr key={station.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{station.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{productionParts.find((p) => p.id === station.productionPartId)?.productionProcessName ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{station.productionPartName}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openStationEdit(station)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteStation(station.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Unit Defects tab ── */}
      {activeTab === "unitdefects" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t.definitions.countUnitDefects(unitDefects.length)}</span>
            <button onClick={openUnitDefCreate} className="btn-primary flex items-center gap-2" disabled={productionParts.length === 0}>
              <Plus className="w-4 h-4" />
              {t.definitions.addUnitDefect}
            </button>
          </div>
          {unitDefLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.common.loading}</div>
          ) : unitDefects.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">{t.definitions.noUnitDefects}</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.common.name}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductions.process}</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">{t.workerProductionDetail.part}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {unitDefects.map((def) => (
                    <tr key={def.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{def.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{productionParts.find((p) => p.id === def.productionPartId)?.productionProcessName ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{productionParts.find((p) => p.id === def.productionPartId)?.name ?? def.productionPartName ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openUnitDefEdit(def)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteUnitDef(def.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Process Modal ── */}
      {processModal.open && (
        <Modal
          title={processModal.editing ? t.definitions.modalEditProcess : t.definitions.modalNewProcess}
          onClose={() => setProcessModal({ open: false, editing: null })}
        >
          <form onSubmit={submitProcess} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.common.name}</label>
              <input
                className="input w-full"
                value={processForm.name}
                onChange={(e) => setProcessForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            {processError && <p className="text-sm text-red-600">{processError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setProcessModal({ open: false, editing: null })} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={processSaving} className="btn-primary">
                {processSaving ? t.workerProductionForm.saving : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Work Product Modal ── */}
      {prodModal.open && (
        <Modal
          title={prodModal.editing ? t.definitions.modalEditPart : t.definitions.modalNewPart}
          onClose={() => setProdModal({ open: false, editing: null })}
        >
          <form onSubmit={submitProd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.common.name}</label>
              <input
                className="input w-full"
                value={prodForm.name}
                onChange={(e) => setProdForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.workerProductions.process}</label>
              <select
                className="input w-full"
                value={prodForm.productionProcessId}
                onChange={(e) => setProdForm((f) => ({ ...f, productionProcessId: e.target.value }))}
                required
              >
                <option value="">— {t.definitions.selectProcess} —</option>
                {productionProcesses.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {prodError && <p className="text-sm text-red-600">{prodError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setProdModal({ open: false, editing: null })} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={prodSaving} className="btn-primary">
                {prodSaving ? t.workerProductionForm.saving : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Component Modal ── */}
      {compModal.open && (
        <Modal
          title={compModal.editing ? t.definitions.modalEditComponent : t.definitions.modalNewComponent}
          onClose={() => setCompModal({ open: false, editing: null })}
        >
          <form onSubmit={submitComp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.common.name}</label>
              <input
                className="input w-full"
                value={compForm.name}
                onChange={(e) => setCompForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.workerProductionDetail.part}</label>
              <select
                className="input w-full"
                value={compForm.productionPartId}
                onChange={(e) => setCompForm((f) => ({ ...f, productionPartId: e.target.value }))}
                required
              >
                <option value="">— {t.definitions.selectPart} —</option>
                {productionParts.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.productionProcessName} → {prod.name}</option>
                ))}
              </select>
            </div>
            {compError && <p className="text-sm text-red-600">{compError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setCompModal({ open: false, editing: null })} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={compSaving} className="btn-primary">
                {compSaving ? t.workerProductionForm.saving : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Defect Category Modal ── */}
      {defModal.open && (
        <Modal
          title={defModal.editing ? t.definitions.modalEditDefect : t.definitions.modalNewDefect}
          onClose={() => setDefModal({ open: false, editing: null })}
        >
          <form onSubmit={submitDef} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.common.name}</label>
              <input
                className="input w-full"
                value={defForm.name}
                onChange={(e) => setDefForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.workerProductionDetail.component}</label>
              <select
                className="input w-full"
                value={defForm.productionComponentId}
                onChange={(e) => setDefForm((f) => ({ ...f, productionComponentId: e.target.value }))}
                required
              >
                <option value="">— {t.definitions.selectComponent} —</option>
                {components.map((comp) => {
                  const part = productionParts.find((p) => p.id === comp.productionPartId);
                  const label = part
                    ? `${part.productionProcessName} → ${comp.productionPartName} → ${comp.name}`
                    : comp.productionPartName ? `${comp.productionPartName} → ${comp.name}` : comp.name;
                  return <option key={comp.id} value={comp.id}>{label}</option>;
                })}
              </select>
            </div>
            {defError && <p className="text-sm text-red-600">{defError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setDefModal({ open: false, editing: null })} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={defSaving} className="btn-primary">
                {defSaving ? t.workerProductionForm.saving : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Station Modal ── */}
      {stationModal.open && (
        <Modal
          title={stationModal.editing ? t.definitions.modalEditStation : t.definitions.modalNewStation}
          onClose={() => setStationModal({ open: false, editing: null })}
        >
          <form onSubmit={submitStation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.common.name}</label>
              <input
                className="input w-full"
                value={stationForm.name}
                onChange={(e) => setStationForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.workerProductionDetail.part}</label>
              <select
                className="input w-full"
                value={stationForm.productionPartId}
                onChange={(e) => setStationForm((f) => ({ ...f, productionPartId: e.target.value }))}
                required
              >
                <option value="">— {t.definitions.selectPart} —</option>
                {productionParts.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.productionProcessName} → {prod.name}</option>
                ))}
              </select>
            </div>
            {stationError && <p className="text-sm text-red-600">{stationError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setStationModal({ open: false, editing: null })} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={stationSaving} className="btn-primary">
                {stationSaving ? t.workerProductionForm.saving : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Unit Defect Modal ── */}
      {unitDefModal.open && (
        <Modal
          title={unitDefModal.editing ? t.definitions.modalEditUnitDefect : t.definitions.modalNewUnitDefect}
          onClose={() => setUnitDefModal({ open: false, editing: null })}
        >
          <form onSubmit={submitUnitDef} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.common.name}</label>
              <input
                className="input w-full"
                value={unitDefForm.name}
                onChange={(e) => setUnitDefForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">{t.workerProductionDetail.part}</label>
              <select
                className="input w-full"
                value={unitDefForm.productionPartId}
                onChange={(e) => setUnitDefForm((f) => ({ ...f, productionPartId: e.target.value }))}
                required
              >
                <option value="">— {t.definitions.selectPart} —</option>
                {productionParts.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.productionProcessName} → {prod.name}</option>
                ))}
              </select>
            </div>
            {unitDefError && <p className="text-sm text-red-600">{unitDefError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setUnitDefModal({ open: false, editing: null })} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={unitDefSaving} className="btn-primary">
                {unitDefSaving ? t.workerProductionForm.saving : t.common.save}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
