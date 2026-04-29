import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [totalResult, submittedResult, approvedResult] = await Promise.all([
    db.select({ count: count() }).from(submissions)
      .where(eq(submissions.userId, session!.user.id)),
    db.select({ count: count() }).from(submissions)
      .where(eq(submissions.userId, session!.user.id)),
    db.select({ count: count() }).from(submissions)
      .where(eq(submissions.userId, session!.user.id)),
  ]);

  const stats = [
    { label: "Total Submissions", value: totalResult[0].count, icon: FileText, color: "text-brand-600 bg-brand-50" },
    { label: "Submitted", value: submittedResult[0].count, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Approved", value: approvedResult[0].count, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">
            Hello, {session?.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s an overview of your activity</p>
        </div>
        <Link href="/submissions/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Submission
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-950">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/submissions/new" className="btn-primary">
            Submit new data
          </Link>
          <Link href="/submissions" className="btn-secondary">
            View all submissions
          </Link>
        </div>
      </div>
    </div>
  );
}
