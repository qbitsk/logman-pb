import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, workCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { DeleteSubmissionButton } from "@/components/DeleteSubmissionButton";
import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

export default async function SubmissionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const userSubmissions = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      units: submissions.units,
      createdAt: submissions.createdAt,
      categoryName: workCategories.name,
    })
    .from(submissions)
    .innerJoin(workCategories, eq(submissions.workCategoryId, workCategories.id))
    .where(eq(submissions.userId, session!.user.id))
    .orderBy(submissions.createdAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-950">My Submissions</h1>
        <Link href="/submissions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Submission
        </Link>
      </div>

      {userSubmissions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 mb-4">No submissions yet.</p>
          <Link href="/submissions/new" className="btn-primary inline-flex">
            Create your first submission
          </Link>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Units</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {userSubmissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 transition-colors">
                  <td className="px-5 py-3 text-gray-400">
                    <Link href={`/submissions/${s.id}`} className="hover:text-brand-600 transition-colors">
                      {s.createdAt.toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 capitalize">
                    {s.categoryName}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{s.units ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      {(s.status === "draft" || s.status === "submitted") && (
                        <Link href={`/submissions/${s.id}/edit`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" aria-label="Edit submission">
                          <Pencil className="w-4 h-4" />
                        </Link>
                      )}
                      {(s.status === "draft" || s.status === "submitted") && (
                        <DeleteSubmissionButton id={s.id} apiPath="/api/submissions" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
