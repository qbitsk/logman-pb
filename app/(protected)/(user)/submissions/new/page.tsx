"use client";

import { useEffect, useState } from "react";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type WorkCategory = { id: string; name: string; type: string | null };
type WorkStation = { id: string; name: string; workCategoryId: string };
type WorkComponent = { id: string; name: string; workCategoryId: string };
type WorkDefect = { id: string; name: string; workCategoryId: string };

export default function NewSubmissionPage() {
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [workDefects, setWorkDefects] = useState<WorkDefect[]>([]);
  const [loaded, setLoaded] = useState(0);
  const loading = loaded < 4;

  function done() { setLoaded((n) => n + 1); }

  useEffect(() => {
    fetch("/api/categories?type=work").then((r) => r.json()).then(setCategories).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents).finally(done);
  }, []);

  useEffect(() => {
    fetch("/api/work-defects").then((r) => r.json()).then(setWorkDefects).finally(done);
  }, []);

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

      {loading ? (
        <div className="card max-w-2xl text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <div className="card max-w-2xl">
          <SubmissionForm
            workCategories={categories}
            workStations={stations}
            workComponents={components}
            workDefects={workDefects}
          />
        </div>
      )}
    </div>
  );
}

