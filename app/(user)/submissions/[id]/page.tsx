import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, workCategories, workStations, workComponentDefects, workComponents, workComponentDefectCategories } from "@/lib/db/schema";
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

  const [defects, workStation, workCategory] = await Promise.all([
    db
      .select({
        workComponentName: workComponents.name,
        defectCategoryName: workComponentDefectCategories.name,
        units: workComponentDefects.units,
      })
      .from(workComponentDefects)
      .innerJoin(workComponents, eq(workComponentDefects.workComponentId, workComponents.id))
      .innerJoin(workComponentDefectCategories, eq(workComponentDefects.workComponentDefectCategoryId, workComponentDefectCategories.id))
      .where(eq(workComponentDefects.submissionId, id)),

    submission.workStationId
      ? db
          .select({ name: workStations.name })
          .from(workStations)
          .where(eq(workStations.id, submission.workStationId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    submission.workCategoryId
      ? db
          .select({ name: workCategories.name })
          .from(workCategories)
          .where(eq(workCategories.id, submission.workCategoryId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

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
          <p className="label">Work Category</p>
          <p className="text-sm text-gray-800">{workCategory?.name ?? submission.workCategoryId}</p>
        </div>

        {workStation && (
          <div>
            <p className="label">Work Station</p>
            <p className="text-sm text-gray-800">{workStation.name}</p>
          </div>
        )}

        {submission.units != null && (() => {
          const defectedUnits = defects.reduce((sum, d) => sum + d.units, 0);
          const goodUnits = submission.units - defectedUnits;
          return (
            <>
              <div>
                <p className="label">Units</p>
                <p className="text-sm text-gray-800">{submission.units}</p>
              </div>
              {defects.length > 0 && (
                <>
                  <div>
                    <p className="label">Defected Units</p>
                    <p className="text-sm text-red-600 font-medium">{defectedUnits}</p>
                  </div>
                  <div>
                    <p className="label">Produced Units</p>
                    <p className="text-sm text-emerald-600 font-medium">{goodUnits}</p>
                  </div>
                </>
              )}
            </>
          );
        })()}

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

        {defects.length > 0 && (
          <div>
            <p className="label">Defects</p>
            <div className="mt-1 divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <span>Component</span>
                <span>Defect Category</span>
                <span className="text-right">Units</span>
              </div>
              {defects.map((d, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-x-4 px-3 py-2 text-sm text-gray-800">
                  <span>{d.workComponentName}</span>
                  <span>{d.defectCategoryName}</span>
                  <span className="text-right font-medium">{d.units}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
