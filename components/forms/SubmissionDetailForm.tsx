"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

const STATUSES = ["draft", "submitted", "reviewed", "approved", "rejected"] as const;
const CATEGORIES = ["general", "technical", "financial", "hr", "other"] as const;

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-blue-100 text-blue-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

type Props = {
  submission: {
    id: string;
    title: string;
    description: string;
    category: string;
    notes: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userName: string;
    userEmail: string;
  };
};

export function SubmissionDetailForm({ submission }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: submission.title,
    description: submission.description,
    category: submission.category,
    notes: submission.notes ?? "",
    status: submission.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/admin/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, notes: form.notes || null }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save changes.");
      return;
    }

    setSuccess(true);
    router.push("/admin/submissions");
  };

  return (
    <div className="max-w-2xl">
      {/* Meta */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[form.status])}>
          {form.status}
        </span>
        <span className="text-sm text-gray-500">
          by <span className="font-medium text-gray-700">{submission.userName}</span>{" "}
          <span className="text-gray-400">({submission.userEmail})</span>
        </span>
        <span className="text-sm text-gray-400 ml-auto">
          Updated {new Date(submission.updatedAt).toLocaleString()}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Status */}
        <div>
          <label className="label" htmlFor="status">Status</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setForm((prev) => ({ ...prev, status: s })); setSuccess(false); }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors",
                  form.status === s
                    ? statusStyles[s] + " border-transparent ring-2 ring-offset-1 ring-brand-400"
                    : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            className="input"
            value={form.title}
            onChange={handleChange}
            minLength={3}
            maxLength={100}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            className="input"
            value={form.category}
            onChange={handleChange}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[120px] resize-y"
            value={form.description}
            onChange={handleChange}
            minLength={10}
            maxLength={2000}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="notes">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            id="notes"
            name="notes"
            className="input min-h-[80px] resize-y"
            value={form.notes}
            onChange={handleChange}
            maxLength={500}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">Changes saved.</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/admin/submissions")}
            className="btn-secondary"
          >
            Back
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
