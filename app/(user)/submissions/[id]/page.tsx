import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, Pencil } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-blue-100 text-blue-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-600",
};

export default async function UserSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { id } = await params;
  const isAdmin = session?.user?.role === "admin";

  const [submission] = await db
    .select()
    .from(submissions)
    .where(
      isAdmin
        ? eq(submissions.id, id)
        : and(eq(submissions.id, id), eq(submissions.userId, session!.user.id))
    )
    .limit(1);

  if (!submission) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={isAdmin ? "/admin/submissions" : "/submissions"}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        {isAdmin && (
          <Link
            href={`/admin/submissions/${submission.id}`}
            className="btn-primary inline-flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mt-2">
          <span className={clsx("badge capitalize text-sm px-3 py-1 rounded-full font-medium", statusStyles[submission.status])}>
            {submission.status}
          </span>
          <span className="text-sm text-gray-400">
            {submission.createdAt.toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <p className="label">Category</p>
          <p className="text-sm text-gray-800 capitalize">{submission.category}</p>
        </div>

        {submission.notes && (
          <div>
            <p className="label">Notes</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.notes}</p>
          </div>
        )}

        <div>
          <p className="label">Submitted</p>
          <p className="text-sm text-gray-500">{submission.createdAt.toLocaleString()}</p>
        </div>

        {submission.updatedAt > submission.createdAt && (
          <div>
            <p className="label">Last updated</p>
            <p className="text-sm text-gray-500">{submission.updatedAt.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
