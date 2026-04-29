"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { submissionSchema, type SubmissionInput } from "@/lib/validations/submission";

const STATUSES = ["draft", "submitted", "reviewed", "approved", "rejected"] as const;

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-blue-100 text-blue-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

type Submission = {
  id: string;
  workCategoryId: string;
  workStationId: string | null;
  units: number | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userEmail: string;
};

type WorkCategory = {
  id: string;
  name: string;
  type: string | null;
};

type WorkStation = {
  id: string;
  name: string;
  workCategoryId: string;
};

type Props = {
  submission?: Submission;
  workCategories: WorkCategory[];
  workStations: WorkStation[];
};

export function SubmissionForm({ submission, workCategories, workStations }: Props) {
  const router = useRouter();
  const isEdit = !!submission;

  const [form, setForm] = useState({
    workCategoryId: submission?.workCategoryId ?? (workCategories[0]?.id ?? ""),
    workStationId: submission?.workStationId ?? "",
    units: submission?.units?.toString() ?? "",
    notes: submission?.notes ?? "",
    status: submission?.status ?? "draft",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SubmissionInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredStations = workStations.filter(
    (ws) => ws.workCategoryId === form.workCategoryId
  );

  function set(key: "workCategoryId" | "workStationId" | "units" | "notes" | "status", value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset station when category changes
      if (key === "workCategoryId") next.workStationId = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    if (!isEdit) {
      const result = submissionSchema.safeParse({
        workCategoryId: form.workCategoryId,
        workStationId: form.workStationId || null,
        units: form.units ? parseInt(form.units, 10) : null,
        notes: form.notes,
      });
      if (!result.success) {
        const fieldErrors: typeof errors = {};
        result.error.issues.forEach((issue) => {
          const key = issue.path[0] as keyof SubmissionInput;
          fieldErrors[key] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/submissions/${submission!.id}` : "/api/submissions";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? JSON.stringify({ ...form, workStationId: form.workStationId || null, units: form.units ? parseInt(form.units, 10) : null, notes: form.notes || null })
        : JSON.stringify({ workCategoryId: form.workCategoryId, workStationId: form.workStationId || null, units: form.units ? parseInt(form.units, 10) : null, notes: form.notes });

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
        router.push("/admin/submissions");
      } else {
        router.push("/submissions");
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
          <span className="text-sm text-gray-500">
            by <span className="font-medium text-gray-700">{submission!.userName}</span>{" "}
            <span className="text-gray-400">({submission!.userEmail})</span>
          </span>
          <span className="text-sm text-gray-400 ml-auto">
            Updated {new Date(submission!.updatedAt).toLocaleString()}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isEdit ? "card space-y-5" : "space-y-5"}>
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {serverError}
          </div>
        )}

        {isEdit && (
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
                      ? statusStyles[s] + " border-transparent ring-2 ring-offset-1 ring-brand-400"
                      : "bg-white text-gray-500 border-gray-200 hover:border-brand-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="workCategoryId">Category{!isEdit && " *"}</label>
          <select
            id="workCategoryId"
            name="workCategoryId"
            value={form.workCategoryId}
            onChange={(e) => set("workCategoryId", e.target.value)}
            className="input"
          >
            {workCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.workCategoryId && <p className="text-red-600 text-xs mt-1">{errors.workCategoryId}</p>}
        </div>

        <div>
          <label className="label" htmlFor="workStationId">
            Work Station <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="workStationId"
            name="workStationId"
            value={form.workStationId}
            onChange={(e) => set("workStationId", e.target.value)}
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

        {success && <p className="text-sm text-emerald-600">Changes saved.</p>}

        <div className={clsx("flex gap-3 pt-2", isEdit && "justify-end")}>
          {isEdit ? (
            <>
              <button type="button" onClick={() => router.push("/admin/submissions")} className="btn-secondary">
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
