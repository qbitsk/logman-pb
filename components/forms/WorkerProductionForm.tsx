"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { signOut } from "@/lib/auth/client";
import { workerProductionSchema, type WorkerProductionInput } from "@/lib/validations/worker-production";
import { Trash2, Plus, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

function generateKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const statusStyles: Record<string, string> = {
  new:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function getWorkerProductionStatus(createdAt: Date): "new" | "completed" {
  const today = new Date();
  return (
    createdAt.getFullYear() === today.getFullYear() &&
    createdAt.getMonth() === today.getMonth() &&
    createdAt.getDate() === today.getDate()
  ) ? "new" : "completed";
}

type WorkerProduction = {
  id: string;
  productionPartId: string;
  productionStationId: string | null;
  units: number | null;
  shift: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userEmail: string;
};

type ProductionPart = {
  id: string;
  name: string;
  productionProcessId: string;
};

type ProductionProcess = {
  id: string;
  name: string;
};

type ProductionStation = {
  id: string;
  name: string;
  productionPartId: string;
};

type ProductionComponent = {
  id: string;
  name: string;
  productionPartId: string;
};

type ProductionDefect = {
  id: string;
  name: string;
  type: "unit" | "component";
  productionPartId: string;
  productionComponentId: string | null;
};

type DefectEntry = {
  _key: string;
  /** UI-only: drives cascading filters */
  type: "unit" | "component";
  /** UI-only: drives cascading filter for component-type defects */
  productionComponentId: string;
  productionDefectId: string;
  units: string;
};

type Props = {
  production?: WorkerProduction;
  productionProcesses: ProductionProcess[];
  productionParts: ProductionPart[];
  productionStations: ProductionStation[];
  productionComponents: ProductionComponent[];
  productionDefects: ProductionDefect[];
  existingDefects?: { productionDefectId: string; units: number }[];
  editUrl?: string;
  backUrl?: string;
  initialPartId?: string;
};

export function WorkerProductionForm({ production, productionProcesses, productionParts, productionStations, productionComponents, productionDefects, existingDefects, editUrl, backUrl, initialPartId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = !!production;
  const resolvedBackUrl = backUrl ?? (isEdit ? "/admin/worker-productions" : "/worker-productions");

  const [productionProcessId, setProductionProcessId] = useState(() => {
    const initialProductId = production?.productionPartId ?? initialPartId ?? productionParts[0]?.id ?? "";
    const product = productionParts.find((p) => p.id === initialProductId);
    return product?.productionProcessId ?? productionProcesses[0]?.id ?? "";
  });

  const filteredProducts = productionParts.filter((p) => p.productionProcessId === productionProcessId);

  const [form, setForm] = useState({
    productionPartId: production?.productionPartId ?? initialPartId ?? (productionParts[0]?.id ?? ""),
    productionStationId: production?.productionStationId ?? "",
    units: production?.units?.toString() ?? "",
    shift: production?.shift?.toString() ?? "",
    notes: production?.notes ?? "",
  });
  const [defects, setDefects] = useState<DefectEntry[]>(() =>
    (existingDefects ?? []).map((d) => {
      const wd = productionDefects.find((w) => w.id === d.productionDefectId);
      return {
        _key: generateKey(),
        type: wd?.type ?? "component",
        productionComponentId: wd?.productionComponentId ?? "",
        productionDefectId: d.productionDefectId,
        units: d.units.toString(),
      };
    })
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkerProductionInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLogoffModal, setShowLogoffModal] = useState(false);
  const [loggingOff, setLoggingOff] = useState(false);

  const filteredStations = productionStations.filter(
    (ws) => ws.productionPartId === form.productionPartId
  );

  function handleProductionProcessChange(newProcessId: string) {
    setProductionProcessId(newProcessId);
    const firstProduct = productionParts.find((p) => p.productionProcessId === newProcessId);
    set("productionPartId", firstProduct?.id ?? "");
  }

  function set(key: "productionPartId" | "productionStationId" | "units" | "shift" | "notes", value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset station when work product changes
      if (key === "productionPartId") next.productionStationId = "";
      return next;
    });
    if (key === "productionPartId") {
      setDefects((prev) =>
        prev.map((d) => ({ ...d, productionComponentId: "", productionDefectId: "" }))
      );
    }
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSuccess(false);
  }

  function addDefect(type: "unit" | "component") {
    setDefects((prev) => [
      ...prev,
      { _key: generateKey(), type, productionComponentId: "", productionDefectId: "", units: "" },
    ]);
  }

  function removeDefect(key: string) {
    setDefects((prev) => prev.filter((d) => d._key !== key));
  }

  function setDefect(
    key: string,
    field: "type" | "productionComponentId" | "productionDefectId" | "units",
    value: string
  ) {
    setDefects((prev) =>
      prev.map((d) => {
        if (d._key !== key) return d;
        const next = { ...d, [field]: value };
        if (field === "type") { next.productionComponentId = ""; next.productionDefectId = ""; }
        if (field === "productionComponentId") next.productionDefectId = "";
        return next;
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    if (!isEdit) {
      const result = workerProductionSchema.safeParse({
        productionPartId: form.productionPartId,
        productionStationId: form.productionStationId || null,
        units: form.units ? parseInt(form.units, 10) : null,
        shift: form.shift ? (parseInt(form.shift, 10) as 1 | 2 | 3) : null,
        notes: form.notes,
      });
      if (!result.success) {
        const fieldErrors: typeof errors = {};
        result.error.issues.forEach((issue) => {
          const key = issue.path[0] as keyof WorkerProductionInput;
          fieldErrors[key] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    try {
      const url = isEdit ? (editUrl ?? `/api/admin/worker-productions/${production!.id}`) : "/api/worker-productions";
      const method = isEdit ? "PATCH" : "POST";
      const parsedDefects = defects
        .filter((d) => d.productionDefectId && d.units)
        .map((d) => ({
          productionDefectId: d.productionDefectId,
          units: parseInt(d.units, 10),
        }));

      const body = isEdit
        ? JSON.stringify({ ...form, productionStationId: form.productionStationId || null, units: form.units ? parseInt(form.units, 10) : null, shift: form.shift ? parseInt(form.shift, 10) : null, notes: form.notes || null, workerProductionDefects: parsedDefects })
        : JSON.stringify({ productionPartId: form.productionPartId, productionStationId: form.productionStationId || null, units: form.units ? parseInt(form.units, 10) : null, shift: form.shift ? parseInt(form.shift, 10) : null, notes: form.notes, workerProductionDefects: parsedDefects });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Something went wrong.");
        return;
      }

      if (isEdit) {
        setSuccess(true);
        router.push(resolvedBackUrl);
      } else {
        setShowLogoffModal(true);
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoff() {
    setLoggingOff(true);
    await signOut();
    router.push("/login");
  }

  return (
    <div className={isEdit ? "max-w-2xl" : undefined}>
      {showLogoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t.workerProductionForm.submitSuccess}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {t.workerProductionForm.signOutQuestion}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setShowLogoffModal(false); router.push("/worker-productions"); }}
                disabled={loggingOff}
                className="btn-secondary"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleLogoff}
                disabled={loggingOff}
                className="btn-primary"
              >
                {loggingOff ? t.common.signingOut : t.common.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
      {isEdit && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          {(() => {
            const status = getWorkerProductionStatus(production!.createdAt);
            return (
              <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[status])}>
                {t.status[status] ?? status}
              </span>
            );
          })()}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">{production!.userName}</span>
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500 ml-auto">
            {new Date(production!.createdAt).toLocaleString()}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isEdit ? "card space-y-5" : "space-y-5"}>
        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {serverError}
          </div>
        )}

        <div>
          <label className="label" htmlFor="productionProcessId">{t.workerProductionForm.process}{!isEdit && " *"}</label>
          <select
            id="productionProcessId"
            value={productionProcessId}
            onChange={(e) => handleProductionProcessChange(e.target.value)}
            className="input"
          >
            {productionProcesses.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="productionPartId">{t.workerProductionForm.part}{!isEdit && " *"}</label>
          <select
            id="productionPartId"
            name="productionPartId"
            value={form.productionPartId}
            onChange={(e) => set("productionPartId", e.target.value)}
            className="input"
          >
            {filteredProducts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.productionPartId && <p className="text-red-600 text-xs mt-1">{errors.productionPartId}</p>}
        </div>

        <div>
          <label className="label">
            {t.workerProductionForm.shift} <span className="text-gray-400 font-normal">({t.common.optional})</span>
          </label>
          <div className="flex gap-2 mt-1">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("shift", form.shift === s.toString() ? "" : s.toString())}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors",
                  form.shift === s.toString()
                    ? "bg-brand-600 text-white border-transparent"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="productionStationId">
            {t.workerProductionForm.workStation} <span className="text-gray-400 font-normal">({t.common.optional})</span>
          </label>
          <div id="productionStationId" className="flex flex-wrap gap-2 mt-1">
            {filteredStations.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => set("productionStationId", form.productionStationId === ws.id ? "" : ws.id)}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors",
                  form.productionStationId === ws.id
                    ? "bg-brand-600 text-white border-transparent"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300"
                )}
              >
                {ws.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="units">
            {t.workerProductionForm.okParts} <span className="text-gray-400 font-normal">({t.common.optional})</span>
          </label>
          <input
            id="units"
            name="units"
            type="number"
            min={1}
            value={form.units}
            onChange={(e) => set("units", e.target.value)}
            className="input"
            placeholder={t.workerProductionForm.unitsPlaceholder}
          />
          {errors.units && <p className="text-red-600 text-xs mt-1">{errors.units}</p>}
        </div>

        <div>
          <label className="label" htmlFor="notes">
            {t.workerProductionForm.notes} <span className="text-gray-400 font-normal">({t.common.optional})</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={isEdit ? undefined : 2}
            className={clsx("input", isEdit ? "min-h-[80px] resize-y" : "resize-none")}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={!isEdit ? t.workerProductionForm.notesPlaceholder : undefined}
            maxLength={isEdit ? 500 : undefined}
          />
          {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="label">{t.workerProductionForm.defects}</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => addDefect("unit")} className="btn-secondary inline-flex items-center gap-1 text-xs py-1 px-2">
                <Plus className="w-3 h-3" /> {t.workerProductionForm.addPartDefect}
              </button>
              <button type="button" onClick={() => addDefect("component")} className="btn-secondary inline-flex items-center gap-1 text-xs py-1 px-2">
                <Plus className="w-3 h-3" /> {t.workerProductionForm.addComponentDefect}
              </button>
            </div>
          </div>
          {defects.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t.workerProductionForm.noDefects}</p>
          )}
          <div className="space-y-2">
            {defects.map((defect) => {
              const filteredComponents = productionComponents.filter(
                (wc) => wc.productionPartId === form.productionPartId
              );
              const filteredDefects = productionDefects.filter((wd) => {
                if (wd.productionPartId !== form.productionPartId) return false;
                if (wd.type !== defect.type) return false;
                if (defect.type === "component") {
                  return wd.productionComponentId === (defect.productionComponentId || null);
                }
                // unit defects must have no associated component
                return wd.productionComponentId === null;
              });
              return (
                <div key={defect._key} className="flex flex-wrap gap-2 items-center">
                  {defect.type === "component" && (
                    <select
                      value={defect.productionComponentId}
                      onChange={(e) => setDefect(defect._key, "productionComponentId", e.target.value)}
                      className="input flex-1 min-w-[140px]"
                    >
                      <option value="">{t.workerProductionForm.componentOption}</option>
                      {filteredComponents.map((wc) => (
                        <option key={wc.id} value={wc.id}>{wc.name}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={defect.productionDefectId}
                    onChange={(e) => setDefect(defect._key, "productionDefectId", e.target.value)}
                    className="input flex-1 min-w-[140px]"
                  >
                    <option value="">{t.workerProductionForm.defectOption}</option>
                    {filteredDefects.map((wd) => (
                      <option key={wd.id} value={wd.id}>{wd.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={defect.units}
                    onChange={(e) => setDefect(defect._key, "units", e.target.value)}
                    className="input w-24"
                    placeholder={t.workerProductionForm.defectUnitsPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => removeDefect(defect._key)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {success && <p className="text-sm text-emerald-600">{t.workerProductionForm.changesSaved}</p>}

        <div className="flex gap-3 justify-end">
          {isEdit ? (
            <>
              <button type="button" onClick={() => router.push(resolvedBackUrl)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t.workerProductionForm.saving : t.workerProductionForm.saveChanges}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => router.back()} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? t.workerProductionForm.submitting : t.workerProductionForm.submit}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
