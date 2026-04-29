import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users, workCategories } from "@/lib/db/schema";
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

  const [[row], categories] = await Promise.all([
    db
      .select({
        id: submissions.id,
        workCategoryId: submissions.workCategoryId,
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
  ]);

  if (!row) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950">Submission Detail</h1>
        <p className="text-sm text-gray-500 mt-1">#{row.id}</p>
      </div>
      <SubmissionForm submission={row} workCategories={categories} />
    </div>
  );
}
