"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "editor" | "admin";
  createdAt: string;
};

const roleStyles: Record<string, string> = {
  user:   "bg-gray-100 text-gray-600",
  editor: "bg-blue-100 text-blue-700",
  admin:  "bg-brand-100 text-brand-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function updateRole(userId: string, role: User["role"]) {
    setUpdating(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    }
    setUpdating(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-950 mb-6">User Management</h1>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-brand-50/40">
                  <td className="px-5 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", roleStyles[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      disabled={updating === user.id}
                      onChange={(e) => updateRole(user.id, e.target.value as User["role"])}
                      className="input py-1 w-28"
                    >
                      <option value="user">user</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
