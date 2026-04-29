"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submissionSchema, type SubmissionInput } from "@/lib/validations/submission";

const categories = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical" },
  { value: "financial", label: "Financial" },
  { value: "hr", label: "HR" },
  { value: "other", label: "Other" },
];

export function SubmissionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SubmissionInput, string>>>({});
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState<SubmissionInput>({
    category: "general",
    notes: "",
  });

  function set<K extends keyof SubmissionInput>(key: K, value: SubmissionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const result = submissionSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof SubmissionInput;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/submissions");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {serverError}
        </div>
      )}

      <div>
        <label className="label" htmlFor="category">Category *</label>
        <select
          id="category"
          value={form.category} onChange={(e) => set("category", e.target.value as SubmissionInput["category"])}
          className="input"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="notes" rows={2}
          value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
          className="input resize-none" placeholder="Any additional notes…"
        />
        {errors.notes && <p className="text-red-600 text-xs mt-1">{errors.notes}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Submitting…" : "Submit"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
