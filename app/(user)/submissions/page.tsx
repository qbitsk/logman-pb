import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Plus } from "lucide-react";
import { clsx } from "clsx";

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-blue-100 text-blue-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

export default async function SubmissionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const userSubmissions = await db.query.submissions.findMany({
    where: eq(submissions.userId, session!.user.id),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-950">My Submissions</h1>
        <Link href="/submissions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New
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
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {userSubmissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-brand-50/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.title}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{s.category}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("badge capitalize", statusStyles[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {s.createdAt.toLocaleDateString()}
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
