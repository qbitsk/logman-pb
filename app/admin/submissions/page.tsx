import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteSubmissionButton } from "@/components/DeleteSubmissionButton";
import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

export default async function AdminSubmissionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const rows = await db
    .select({
      id: submissions.id,
      categoryName: workCategories.name,
      status: submissions.status,
      units: submissions.units,
      createdAt: submissions.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .innerJoin(workCategories, eq(submissions.workCategoryId, workCategories.id))
    .orderBy(submissions.createdAt);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950">All Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">{rows.length} total</p>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">No submissions yet.</p>
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
                <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 transition-colors">
                  <td className="px-5 py-3 text-gray-400">
                    <Link href={`/admin/submissions/${s.id}`} className="hover:text-brand-600 transition-colors">
                      {s.createdAt.toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{s.categoryName}</td>
                  <td className="px-5 py-3 text-gray-500">{s.units ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-900">{s.userName}</span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/submissions/${s.id}`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" aria-label="Edit submission">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteSubmissionButton id={s.id} apiPath="/api/admin/submissions" />
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
