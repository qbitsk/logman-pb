"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { clsx } from "clsx";

// ─── Types ───────────────────────────────────────────────────────────────────

type WorkCategory = {
  id: string;
  name: string;
  type: "work" | "defect";
  createdAt: string;
};

type WorkComponent = {
  id: string;
  name: string;
  workCategoryId: string;
  categoryName: string;
  createdAt: string;
};

type WorkDefect = {
  id: string;
  name: string;
  workComponentId: string | null;
  componentName: string | null;
  categoryName: string | null;
  createdAt: string;
};

type Tab = "categories" | "components" | "defects";

const TABS: { id: Tab; label: string }[] = [
  { id: "categories", label: "Categories" },
  { id: "components", label: "Components" },
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
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModal, setCatModal] = useState<{ open: boolean; editing: WorkCategory | null }>({ open: false, editing: null });
  const [catForm, setCatForm] = useState({ name: "", type: "" });
  const [catError, setCatError] = useState<string | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  // ── Components state ──
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compModal, setCompModal] = useState<{ open: boolean; editing: WorkComponent | null }>({ open: false, editing: null });
  const [compForm, setCompForm] = useState({ name: "", workCategoryId: "" });
  const [compError, setCompError] = useState<string | null>(null);
  const [compSaving, setCompSaving] = useState(false);

  // ── Defects state ──
  const [defects, setDefects] = useState<WorkDefect[]>([]);
  const [defLoading, setDefLoading] = useState(true);
  const [defModal, setDefModal] = useState<{ open: boolean; editing: WorkDefect | null }>({ open: false, editing: null });
  const [defForm, setDefForm] = useState({ name: "", workComponentId: "" });
  const [defError, setDefError] = useState<string | null>(null);
  const [defSaving, setDefSaving] = useState(false);

  // ── Fetch ──
  useEffect(() => {
    fetch("/api/admin/categories?type=work")
      .then((r) => r.json())
      .then(setCategories)
      .finally(() => setCatLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/work-components")
      .then((r) => r.json())
      .then(setComponents)
      .finally(() => setCompLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/work-defects")
      .then((r) => r.json())
      .then(setDefects)
      .finally(() => setDefLoading(false));
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Work Categories handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openCatCreate() {
    setCatForm({ name: "", type: "" });
    setCatError(null);
    setCatModal({ open: true, editing: null });
  }

  function openCatEdit(cat: WorkCategory) {
    setCatForm({ name: cat.name, type: cat.type ?? "" });
    setCatError(null);
    setCatModal({ open: true, editing: cat });
  }

  async function submitCat(e: React.FormEvent) {
    e.preventDefault();
    setCatError(null);
    setCatSaving(true);

    const payload = { name: catForm.name, type: catForm.type || "work" };
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
      const saved: WorkCategory = await res.json();
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
  // Work Components handlers
  // ───────────────────────────────────────────────────────────────────────────

  function openCompCreate() {
    setCompForm({ name: "", workCategoryId: categories[0]?.id ?? "" });
    setCompError(null);
    setCompModal({ open: true, editing: null });
  }

  function openCompEdit(comp: WorkComponent) {
    setCompForm({ name: comp.name, workCategoryId: comp.workCategoryId });
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
      const catName = categories.find((c) => c.id === saved.workCategoryId)?.name ?? "";
      const enriched: WorkComponent = { ...saved, categoryName: catName };
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
      const catName = components.find((c) => c.id === saved.workComponentId)
        ? categories.find((cat) => cat.id === components.find((c) => c.id === saved.workComponentId)?.workCategoryId)?.name ?? null
        : null;
      const enriched: WorkDefect = { ...saved, componentName: compName, categoryName: catName };
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
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950  dark:text-white">Categories</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage categories, components and defect categories.</p>
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

      {/* ── Work Components tab ── */}
      {activeTab === "components" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{components.length} components</span>
            <button onClick={openCompCreate} className="btn-primary flex items-center gap-2" disabled={categories.length === 0}>
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
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Category</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp) => (
                    <tr key={comp.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{comp.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{comp.categoryName}</td>
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
                        {def.categoryName && def.componentName
                          ? `${def.categoryName} → ${def.componentName}`
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

      {/* ── Category Modal ── */}
      {catModal.open && (
        <Modal
          title={catModal.editing ? "Edit Work Category" : "New Work Category"}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Work Category</label>
              <select
                className="input w-full"
                value={compForm.workCategoryId}
                onChange={(e) => setCompForm((f) => ({ ...f, workCategoryId: e.target.value }))}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                    {comp.categoryName ? `${comp.categoryName} → ${comp.name}` : comp.name}
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
    </div>
  );
}
