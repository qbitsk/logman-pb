"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { workerProductionSchema, type WorkerProductionInput } from "@/lib/validations/worker-production";
import { Trash2, Plus } from "lucide-react";

const STATUSES = ["new", "approved", "rejected"] as const;

function generateKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const statusStyles: Record<string, string> = {
  new:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

type WorkerProduction = {
  id: string;
  productionProductId: string;
  productionStationId: string | null;
  units: number | null;
  shift: number | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userEmail: string;
};

type ProductionProduct = {
  id: string;
  name: string;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
};

type ProductionStation = {
  id: string;
  name: string;
  productionProductId: string;
};

type ProductionComponent = {
  id: string;
  name: string;
  productionProductId: string;
};

type ProductionDefect = {
  id: string;
  name: string;
  type: "unit" | "component";
  productionProductId: string;
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
  categories: Category[];
  productionProducts: ProductionProduct[];
  productionStations: ProductionStation[];
  productionComponents: ProductionComponent[];
  productionDefects: ProductionDefect[];
  existingDefects?: { productionDefectId: string; units: number }[];
  editUrl?: string;
  backUrl?: string;
  allowStatusChange?: boolean;
};

export function WorkerProductionForm({ production, categories, productionProducts, productionStations, productionComponents, productionDefects, existingDefects, editUrl, backUrl, allowStatusChange = false }: Props) {
  const router = useRouter();
  const isEdit = !!production;
  const resolvedBackUrl = backUrl ?? (isEdit ? "/admin/worker-productions" : "/worker-productions");

  const [categoryId, setCategoryId] = useState(() => {
    const initialProductId = production?.productionProductId ?? productionProducts[0]?.id ?? "";
    const product = productionProducts.find((p) => p.id === initialProductId);
    return product?.categoryId ?? categories[0]?.id ?? "";
  });

  const filteredProducts = productionProducts.filter((p) => p.categoryId === categoryId);

  const [form, setForm] = useState({
    productionProductId: production?.productionProductId ?? (productionProducts[0]?.id ?? ""),
    productionStationId: production?.productionStationId ?? "",
    units: production?.units?.toString() ?? "",
    shift: production?.shift?.toString() ?? "",
    notes: production?.notes ?? "",
    status: production?.status ?? "new",
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

  const filteredStations = productionStations.filter(
    (ws) => ws.productionProductId === form.productionProductId
  );

  function handleCategoryChange(newCategoryId: string) {
    setCategoryId(newCategoryId);
    const firstProduct = productionProducts.find((p) => p.categoryId === newCategoryId);
    set("productionProductId", firstProduct?.id ?? "");
  }

  function set(key: "productionProductId" | "productionStationId" | "units" | "shift" | "notes" | "status", value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset station when work product changes
      if (key === "productionProductId") next.productionStationId = "";
      return next;
    });
    if (key === "productionProductId") {
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
        productionProductId: form.productionProductId,
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
        : JSON.stringify({ productionProductId: form.productionProductId, productionStationId: form.productionStationId || null, units: form.units ? parseInt(form.units, 10) : null, shift: form.shift ? parseInt(form.shift, 10) : null, notes: form.notes, workerProductionDefects: parsedDefects });

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
        router.push("/worker-productions");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={isEdit ? "max-w-2xl" : undefined}>
      {isEdit && (
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[form.status])}>
            {form.status}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            by <span className="font-medium text-gray-700 dark:text-gray-300">{production!.userName}</span>
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500 ml-auto">
            Updated {new Date(production!.updatedAt).toLocaleString()}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isEdit ? "card space-y-5" : "space-y-5"}>
        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {serverError}
          </div>
        )}

        {isEdit && allowStatusChange && (
          <div>
            <label className="label" htmlFor="status">Status</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors",
                    form.status === s
                      ? statusStyles[s] + " border-transparent ring-2 ring-offset-1 ring-brand-400 dark:ring-offset-gray-900"
                      : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="categoryId">Category{!isEdit && " *"}</label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="productionProductId">Product{!isEdit && " *"}</label>
          <select
            id="productionProductId"
            name="productionProductId"
            value={form.productionProductId}
            onChange={(e) => set("productionProductId", e.target.value)}
            className="input"
          >
            {filteredProducts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.productionProductId && <p className="text-red-600 text-xs mt-1">{errors.productionProductId}</p>}
        </div>

        <div>
          <label className="label">
            Shift <span className="text-gray-400 font-normal">(optional)</span>
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
            Work Station <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="productionStationId"
            name="productionStationId"
            value={form.productionStationId}
            onChange={(e) => set("productionStationId", e.target.value)}
            className="input"
          >
            <option value="">— None —</option>
            {filteredStations.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="units">
            Units <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="units"
            name="units"
            type="number"
            min={1}
            value={form.units}
            onChange={(e) => set("units", e.target.value)}
            className="input"
            placeholder="e.g. 10"
          />
          {errors.units && <p className="text-red-600 text-xs mt-1">{errors.units}</p>}
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={isEdit ? undefined : 2}
            className={clsx("input", isEdit ? "min-h-[80px] resize-y" : "resize-none")}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={!isEdit ? "Any additional notes…" : undefined}
            maxLength={isEdit ? 500 : undefined}
          />
          {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">Defects</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => addDefect("unit")} className="btn-secondary inline-flex items-center gap-1 text-xs py-1 px-2">
                <Plus className="w-3 h-3" /> Product <span className="hidden sm:block">Defect</span>
              </button>
              <button type="button" onClick={() => addDefect("component")} className="btn-secondary inline-flex items-center gap-1 text-xs py-1 px-2">
                <Plus className="w-3 h-3" /> Component <span className="hidden sm:block">Defect</span>
              </button>
            </div>
          </div>
          {defects.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No defects added.</p>
          )}
          <div className="space-y-2">
            {defects.map((defect) => {
              const filteredComponents = productionComponents.filter(
                (wc) => wc.productionProductId === form.productionProductId
              );
              const filteredDefects = productionDefects.filter((wd) => {
                if (wd.productionProductId !== form.productionProductId) return false;
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
                      <option value="">— Component —</option>
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
                    <option value="">— Defect —</option>
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
                    placeholder="Units"
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

        {success && <p className="text-sm text-emerald-600">Changes saved.</p>}

        <div className={clsx("flex gap-3 pt-2", isEdit && "justify-end")}>
          {isEdit ? (
            <>
              <button type="button" onClick={() => router.push(resolvedBackUrl)} className="btn-secondary">
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Submitting…" : "Submit"}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary">
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
