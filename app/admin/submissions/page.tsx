import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-blue-100 text-blue-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

export default async function AdminSubmissionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const rows = await db
    .select({
      id: submissions.id,
      category: submissions.category,
      status: submissions.status,
      createdAt: submissions.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
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
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Submitted by</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 transition-colors">
                  <td className="px-5 py-3 text-gray-500 capitalize">{s.category}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-gray-900">{s.userName}</span>
                    <span className="text-gray-400 ml-1 text-xs">({s.userEmail})</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {s.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/submissions/${s.id}`} className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors">
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
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
