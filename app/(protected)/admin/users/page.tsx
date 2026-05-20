"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "operator" | "admin";
  createdAt: string;
};

const roleStyles: Record<string, string> = {
  user:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  operator: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  admin:    "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
};

const emptyCreateForm = { name: "", email: "", password: "", role: "user" as User["role"] };
const emptyEditForm   = { name: "", email: "", role: "user" as User["role"] };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setCreateForm(emptyCreateForm);
    setCreateError(null);
    setShowCreate(true);
  }

  function openEdit(user: User) {
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditError(null);
    setEditTarget(user);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      const newUser: User = await res.json();
      setUsers((prev) => [...prev, newUser]);
      setShowCreate(false);
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to create user" }));
      setCreateError(err?.error ?? "Failed to create user");
    }
    setCreating(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    setSaving(true);
    const res = await fetch(`/api/admin/users/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated: User = await res.json();
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditTarget(null);
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to save" }));
      setEditError(err?.error ?? "Failed to save");
    }
    setSaving(false);
  }

  async function deleteUser(user: User) {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to delete" }));
      alert(err?.error ?? "Failed to delete user.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">User Management</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          User
        </button>
      </div>

      <div className="card p-0 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", roleStyles[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 dark:text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors" aria-label="Edit user">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUser(user)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" aria-label="Delete user">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-brand-950 dark:text-white">New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} minLength={8} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={createForm.role} onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as User["role"] }))}>
                  <option value="user">user</option>
                  <option value="operator">operator</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary">{creating ? "Creating…" : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-brand-950 dark:text-white">Edit User</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitEdit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as User["role"] }))}>
                  <option value="user">user</option>
                  <option value="operator">operator</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
