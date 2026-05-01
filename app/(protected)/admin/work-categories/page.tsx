"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { clsx } from "clsx";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = {
  id: string;
  name: string;
  createdAt: string;
};

type WorkProduct = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
};

type WorkComponent = {
  id: string;
  name: string;
  workProductId: string;
  workProductName: string;
  createdAt: string;
};

type WorkDefect = {
  id: string;
  name: string;
  workComponentId: string | null;
  componentName: string | null;
  workProductName: string | null;
  createdAt: string;
};

type UnitDefect = {
  id: string;
  name: string;
  workProductId: string;
  workProductName: string | null;
  createdAt: string;
};

type Tab = "categories" | "products" | "components" | "defects" | "unitdefects";

const TABS: { id: Tab; label: string }[] = [
  { id: "categories", label: "Categories" },
  { id: "products", label: "Products" },
  { id: "components", label: "Components" },
  { id: "unitdefects", label: "Product Defects" },
  { id: "defects", label: "Component Defects" },
];

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
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  // ── Categories state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModal, setCatModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [catForm, setCatForm] = useState({ name: "" });
  const [catError, setCatError] = useState<string | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  // ── Work Products state ──
  const [workProducts, setWorkProducts] = useState<WorkProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodModal, setProdModal] = useState<{ open: boolean; editing: WorkProduct | null }>({ open: false, editing: null });
  const [prodForm, setProdForm] = useState({ name: "", categoryId: "" });
  const [prodError, setProdError] = useState<string | null>(null);
  const [prodSaving, setProdSaving] = useState(false);

  // ── Components state ──
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compModal, setCompModal] = useState<{ open: boolean; editing: WorkComponent | null }>({ open: false, editing: null });
  const [compForm, setCompForm] = useState({ name: "", workProductId: "" });
  const [compError, setCompError] = useState<string | null>(null);
  const [compSaving, setCompSaving] = useState(false);

  // ── Defects state ──
  const [defects, setDefects] = useState<WorkDefect[]>([]);
  const [defLoading, setDefLoading] = useState(true);
  const [defModal, setDefModal] = useState<{ open: boolean; editing: WorkDefect | null }>({ open: false, editing: null });
  const [defForm, setDefForm] = useState({ name: "", workComponentId: "" });
  const [defError, setDefError] = useState<string | null>(null);
  const [defSaving, setDefSaving] = useState(false);

  // ── Unit Defects state ──
  const [unitDefects, setUnitDefects] = useState<UnitDefect[]>([]);
  const [unitDefLoading, setUnitDefLoading] = useState(true);
  const [unitDefModal, setUnitDefModal] = useState<{ open: boolean; editing: UnitDefect | null }>({ open: false, editing: null });
  const [unitDefForm, setUnitDefForm] = useState({ name: "", workProductId: "" });
  const [unitDefError, setUnitDefError] = useState<string | null>(null);
  const [unitDefSaving, setUnitDefSaving] = useState(false);

  // ── Fetch ──
  useEffect(() => {
    fetch("/api/admin/categories?type=product")
      .then((r) => r.json())
      .then(setCategories)
      .finally(() => setCatLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/work-products")
      .then((r) => r.json())
      .then(setWorkProducts)
      .finally(() => setProdLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/work-components")
      .then((r) => r.json())
      .then(setComponents)
      .finally(() => setCompLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/work-defects?type=component")
      .then((r) => r.json())
      .then(setDefects)
      .finally(() => setDefLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/work-defects?type=unit")
      .then((r) => r.json())
      .then((rows) =>
        setUnitDefects(
          rows.map((r: WorkDefect & { workProductId: string; workProductName: string | null }) => ({
            id: r.id,
            name: r.name,
            workProductId: r.workProductId,
            workProductName: r.workProductName,
            createdAt: r.createdAt,
          }))
        )
      )
      .finally(() => setUnitDefLoading(false));
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Work Categories handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openCatCreate() {
    setCatForm({ name: "" });
    setCatError(null);
    setCatModal({ open: true, editing: null });
  }

  function openCatEdit(cat: Category) {
    setCatForm({ name: cat.name });
    setCatError(null);
    setCatModal({ open: true, editing: cat });
  }

  async function submitCat(e: React.FormEvent) {
    e.preventDefault();
    setCatError(null);
    setCatSaving(true);

    const payload = { name: catForm.name, type: "product" };
    const isEdit = !!catModal.editing;
    const url = isEdit
      ? `/api/admin/categories/${catModal.editing!.id}`
      : "/api/admin/categories";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved: Category = await res.json();
      setCategories((prev) =>
        isEdit ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCatModal({ open: false, editing: null });
    } else {
      const err = await res.json().catch(() => ({}));
      setCatError(err?.error ?? "Failed to save");
    }
    setCatSaving(false);
  }

  async function deleteCat(id: string) {
    if (!confirm("Delete this category? This may affect existing data.")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Work Products handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openProdCreate() {
    setProdForm({ name: "", categoryId: categories[0]?.id ?? "" });
    setProdError(null);
    setProdModal({ open: true, editing: null });
  }

  function openProdEdit(prod: WorkProduct) {
    setProdForm({ name: prod.name, categoryId: prod.categoryId });
    setProdError(null);
    setProdModal({ open: true, editing: prod });
  }

  async function submitProd(e: React.FormEvent) {
    e.preventDefault();
    setProdError(null);
    setProdSaving(true);

    const isEdit = !!prodModal.editing;
    const url = isEdit
      ? `/api/admin/work-products/${prodModal.editing!.id}`
      : "/api/admin/work-products";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prodForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const catName = categories.find((c) => c.id === saved.categoryId)?.name ?? "";
      const enriched: WorkProduct = { ...saved, categoryName: catName };
      setWorkProducts((prev) =>
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
    if (!confirm("Delete this product? This may affect existing data.")) return;
    const res = await fetch(`/api/admin/work-products/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setWorkProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Work Components handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openCompCreate() {
    setCompForm({ name: "", workProductId: workProducts[0]?.id ?? "" });
    setCompError(null);
    setCompModal({ open: true, editing: null });
  }

  function openCompEdit(comp: WorkComponent) {
    setCompForm({ name: comp.name, workProductId: comp.workProductId });
    setCompError(null);
    setCompModal({ open: true, editing: comp });
  }

  async function submitComp(e: React.FormEvent) {
    e.preventDefault();
    setCompError(null);
    setCompSaving(true);

    const isEdit = !!compModal.editing;
    const url = isEdit
      ? `/api/admin/work-components/${compModal.editing!.id}`
      : "/api/admin/work-components";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const productName = workProducts.find((p) => p.id === saved.workProductId)?.name ?? "";
      const enriched: WorkComponent = { ...saved, workProductName: productName };
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
    if (!confirm("Delete this work component? This may affect existing data.")) return;
    const res = await fetch(`/api/admin/work-components/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setComponents((prev) => prev.filter((c) => c.id !== id));
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Defect Categories handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openDefCreate() {
    setDefForm({ name: "", workComponentId: components[0]?.id ?? "" });
    setDefError(null);
    setDefModal({ open: true, editing: null });
  }

  function openDefEdit(def: WorkDefect) {
    setDefForm({ name: def.name, workComponentId: def.workComponentId ?? "" });
    setDefError(null);
    setDefModal({ open: true, editing: def });
  }

  async function submitDef(e: React.FormEvent) {
    e.preventDefault();
    setDefError(null);
    setDefSaving(true);

    const isEdit = !!defModal.editing;
    const url = isEdit
      ? `/api/admin/work-defects/${defModal.editing!.id}`
      : "/api/admin/work-defects";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defForm),
    });

    if (res.ok) {
      const saved = await res.json();
      const compName = components.find((c) => c.id === saved.workComponentId)?.name ?? null;
      const productName = components.find((c) => c.id === saved.workComponentId)?.workProductName ?? null;
      const enriched: WorkDefect = { ...saved, componentName: compName, workProductName: productName };
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
    if (!confirm("Delete this component defect?")) return;
    const res = await fetch(`/api/admin/work-defects/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setDefects((prev) => prev.filter((d) => d.id !== id));
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Unit Defects handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openUnitDefCreate() {
    setUnitDefForm({ name: "", workProductId: workProducts[0]?.id ?? "" });
    setUnitDefError(null);
    setUnitDefModal({ open: true, editing: null });
  }

  function openUnitDefEdit(def: UnitDefect) {
    setUnitDefForm({ name: def.name, workProductId: def.workProductId });
    setUnitDefError(null);
    setUnitDefModal({ open: true, editing: def });
  }

  async function submitUnitDef(e: React.FormEvent) {
    e.preventDefault();
    setUnitDefError(null);
    setUnitDefSaving(true);

    const isEdit = !!unitDefModal.editing;
    const url = isEdit
      ? `/api/admin/work-defects/${unitDefModal.editing!.id}`
      : "/api/admin/work-defects";

    const payload = isEdit
      ? { name: unitDefForm.name, workProductId: unitDefForm.workProductId }
      : { name: unitDefForm.name, workProductId: unitDefForm.workProductId, type: "unit" };

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      const productName = workProducts.find((p) => p.id === saved.workProductId)?.name ?? null;
      const enriched: UnitDefect = {
        id: saved.id,
        name: saved.name,
        workProductId: saved.workProductId,
        workProductName: productName,
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
    if (!confirm("Delete this product defect?")) return;
    const res = await fetch(`/api/admin/work-defects/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setUnitDefects((prev) => prev.filter((d) => d.id !== id));
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950  dark:text-white">Definitions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage categories, components and defects.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Work Categories tab ── */}
      {activeTab === "categories" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories</span>
            <button onClick={openCatCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Category
            </button>
          </div>
          {catLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">No categories yet.</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{cat.name}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openCatEdit(cat)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteCat(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
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

      {/* ── Work Products tab ── */}
      {activeTab === "products" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{workProducts.length} products</span>
            <button onClick={openProdCreate} className="btn-primary flex items-center gap-2" disabled={categories.length === 0}>
              <Plus className="w-4 h-4" />
              Product
            </button>
          </div>
          {prodLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : workProducts.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">No products yet.</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {workProducts.map((prod) => (
                    <tr key={prod.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{prod.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{prod.categoryName}</td>
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{components.length} components</span>
            <button onClick={openCompCreate} className="btn-primary flex items-center gap-2" disabled={workProducts.length === 0}>
              <Plus className="w-4 h-4" />
              Component
            </button>
          </div>
          {compLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : components.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">No components yet.</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp) => (
                    <tr key={comp.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{comp.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{comp.workProductName}</td>
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{defects.length} component defects</span>
            <button onClick={openDefCreate} className="btn-primary flex items-center gap-2" disabled={components.length === 0}>
              <Plus className="w-4 h-4" />
              Component Defect
            </button>
          </div>
          {defLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : defects.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">No component defects yet.</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Component</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {defects.map((def) => (
                    <tr key={def.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{def.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                        {def.workProductName && def.componentName
                          ? `${def.workProductName} → ${def.componentName}`
                          : def.componentName ?? "—"}
                      </td>
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

      {/* ── Unit Defects tab ── */}
      {activeTab === "unitdefects" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{unitDefects.length} product defects</span>
            <button onClick={openUnitDefCreate} className="btn-primary flex items-center gap-2" disabled={workProducts.length === 0}>
              <Plus className="w-4 h-4" />
              Product Defect
            </button>
          </div>
          {unitDefLoading ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : unitDefects.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">No product defects yet.</div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Product</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {unitDefects.map((def) => (
                    <tr key={def.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{def.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{def.workProductName ?? "—"}</td>
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

      {/* ── Category Modal ── */}
      {catModal.open && (
        <Modal
          title={catModal.editing ? "Edit Category" : "New Category"}
          onClose={() => setCatModal({ open: false, editing: null })}
        >
          <form onSubmit={submitCat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
              <input
                className="input w-full"
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            {catError && <p className="text-sm text-red-600">{catError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setCatModal({ open: false, editing: null })} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={catSaving} className="btn-primary">
                {catSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Work Product Modal ── */}
      {prodModal.open && (
        <Modal
          title={prodModal.editing ? "Edit Product" : "New Product"}
          onClose={() => setProdModal({ open: false, editing: null })}
        >
          <form onSubmit={submitProd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
              <input
                className="input w-full"
                value={prodForm.name}
                onChange={(e) => setProdForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Category</label>
              <select
                className="input w-full"
                value={prodForm.categoryId}
                onChange={(e) => setProdForm((f) => ({ ...f, categoryId: e.target.value }))}
                required
              >
                <option value="">— Select Category —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {prodError && <p className="text-sm text-red-600">{prodError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setProdModal({ open: false, editing: null })} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={prodSaving} className="btn-primary">
                {prodSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Component Modal ── */}
      {compModal.open && (
        <Modal
          title={compModal.editing ? "Edit Work Component" : "New Work Component"}
          onClose={() => setCompModal({ open: false, editing: null })}
        >
          <form onSubmit={submitComp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
              <input
                className="input w-full"
                value={compForm.name}
                onChange={(e) => setCompForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Product</label>
              <select
                className="input w-full"
                value={compForm.workProductId}
                onChange={(e) => setCompForm((f) => ({ ...f, workProductId: e.target.value }))}
                required
              >
                {workProducts.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
            </div>
            {compError && <p className="text-sm text-red-600">{compError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setCompModal({ open: false, editing: null })} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={compSaving} className="btn-primary">
                {compSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Defect Category Modal ── */}
      {defModal.open && (
        <Modal
          title={defModal.editing ? "Edit Component Defect" : "New Component Defect"}
          onClose={() => setDefModal({ open: false, editing: null })}
        >
          <form onSubmit={submitDef} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
              <input
                className="input w-full"
                value={defForm.name}
                onChange={(e) => setDefForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Component</label>
              <select
                className="input w-full"
                value={defForm.workComponentId}
                onChange={(e) => setDefForm((f) => ({ ...f, workComponentId: e.target.value }))}
                required
              >
                <option value="">— Select Component —</option>
                {components.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.workProductName ? `${comp.workProductName} → ${comp.name}` : comp.name}
                  </option>
                ))}
              </select>
            </div>
            {defError && <p className="text-sm text-red-600">{defError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setDefModal({ open: false, editing: null })} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={defSaving} className="btn-primary">
                {defSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Unit Defect Modal ── */}
      {unitDefModal.open && (
        <Modal
          title={unitDefModal.editing ? "Edit Product Defect" : "New Product Defect"}
          onClose={() => setUnitDefModal({ open: false, editing: null })}
        >
          <form onSubmit={submitUnitDef} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Name</label>
              <input
                className="input w-full"
                value={unitDefForm.name}
                onChange={(e) => setUnitDefForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Product</label>
              <select
                className="input w-full"
                value={unitDefForm.workProductId}
                onChange={(e) => setUnitDefForm((f) => ({ ...f, workProductId: e.target.value }))}
                required
              >
                <option value="">— Select Product —</option>
                {workProducts.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
            </div>
            {unitDefError && <p className="text-sm text-red-600">{unitDefError}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setUnitDefModal({ open: false, editing: null })} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={unitDefSaving} className="btn-primary">
                {unitDefSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
