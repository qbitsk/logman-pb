import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { SubmissionDetailForm } from "@/components/forms/SubmissionDetailForm";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const { id } = await params;

  const [row] = await db
    .select({
      id: submissions.id,
      category: submissions.category,
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
    .limit(1);

  if (!row) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950">Submission Detail</h1>
        <p className="text-sm text-gray-500 mt-1">#{row.id}</p>
      </div>
      <SubmissionDetailForm submission={row} />
    </div>
  );
}
