import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { workCategories, workStations, workComponents, workComponentDefectCategories } from "@/lib/db/schema";

export default async function NewSubmissionPage() {
  const [categories, stations, components, defectCategories] = await Promise.all([
    db.select().from(workCategories),
    db.select().from(workStations),
    db.select().from(workComponents),
    db.select().from(workComponentDefectCategories),
  ]);

  return (
    <div>
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to submissions
      </Link>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-1">New Submission</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Fill in the form below and submit your data.</p>

      <div className="card max-w-2xl">
        <SubmissionForm
          workCategories={categories}
          workStations={stations}
          workComponents={components}
          workComponentDefectCategories={defectCategories}
        />
      </div>
    </div>
  );
}
