import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  submissions,
  users,
  workCategories,
  workStations,
  workComponents,
  workComponentDefectCategories,
  workComponentDefects,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id } = await params;

  const [[row], categories, stations, components, defectCategories, existingDefects] =
    await Promise.all([
      db
        .select({
          id: submissions.id,
          workCategoryId: submissions.workCategoryId,
          workStationId: submissions.workStationId,
          units: submissions.units,
          notes: submissions.notes,
          status: submissions.status,
          createdAt: submissions.createdAt,
          updatedAt: submissions.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.userId, users.id))
        .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
        .limit(1),
      db.select().from(workCategories),
      db.select().from(workStations),
      db.select().from(workComponents),
      db.select().from(workComponentDefectCategories),
      db
        .select({
          workComponentId: workComponentDefects.workComponentId,
          workComponentDefectCategoryId: workComponentDefects.workComponentDefectCategoryId,
          units: workComponentDefects.units,
        })
        .from(workComponentDefects)
        .where(eq(workComponentDefects.submissionId, id)),
    ]);

  if (!row) notFound();

  return (
    <div>
      <Link
        href={`/submissions/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-brand-950 mb-6">Edit Submission</h1>
      <SubmissionForm
        submission={row}
        workCategories={categories}
        workStations={stations}
        workComponents={components}
        workComponentDefectCategories={defectCategories}
        existingDefects={existingDefects}
        editUrl={`/api/submissions/${id}`}
        backUrl="/submissions"
      />
    </div>
  );
}
