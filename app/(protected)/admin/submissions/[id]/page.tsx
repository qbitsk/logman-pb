import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workCategories, workStations, workComponents, workComponentDefectCategories, workComponentDefects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const { id } = await params;

  const [[row], categories, stations, components, defectCategories] = await Promise.all([
    db
      .select({
        id: submissions.id,
        workCategoryId: submissions.workCategoryId,
        workStationId: submissions.workStationId,
        units: submissions.units,
        shift: submissions.shift,
        notes: submissions.notes,
        status: submissions.status,
        createdAt: submissions.createdAt,
        updatedAt: submissions.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.userId, users.id))
      .where(eq(submissions.id, id))
      .limit(1),
    db.select().from(workCategories),
    db.select().from(workStations),
    db.select().from(workComponents),
    db.select().from(workComponentDefectCategories),
  ]);

  const existingDefects = await db
    .select({
      workComponentId: workComponentDefects.workComponentId,
      workComponentDefectCategoryId: workComponentDefects.workComponentDefectCategoryId,
      units: workComponentDefects.units,
    })
    .from(workComponentDefects)
    .where(eq(workComponentDefects.submissionId, id));

  if (!row) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">Submission Detail</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">#{row.id}</p>
      </div>
      <SubmissionForm
        submission={row}
        workCategories={categories}
        workStations={stations}
        workComponents={components}
        workComponentDefectCategories={defectCategories}
        existingDefects={existingDefects}
      />
    </div>
  );
}
