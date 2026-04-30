"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Submission = {
  id: string;
  workCategoryId: string;
  workStationId: string | null;
  units: number | null;
  shift: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
};

type WorkCategory = { id: string; name: string; type: string | null };
type WorkStation = { id: string; name: string; workCategoryId: string };
type WorkComponent = { id: string; name: string; workCategoryId: string };
type DefectCategory = { id: string; name: string };
type ExistingDefect = { type: string; workComponentId?: string | null; categoryId?: string | null; units: number };

export default function EditSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [defectCategories, setDefectCategories] = useState<DefectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const { existingDefects: defects, ...sub } = data;
        if (sub.status !== "draft" && sub.status !== "submitted") {
          router.replace(`/submissions/${id}`);
          return;
        }
        setSubmission(sub);
        setExistingDefects(defects ?? []);
      });
  }, [id, router]);

  useEffect(() => {
    fetch("/api/categories?type=work").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents);
  }, []);

  useEffect(() => {
    fetch("/api/categories?type=defect").then((r) => r.json()).then(setDefectCategories);
  }, []);

  useEffect(() => {
    if (submission && categories.length && stations.length && components.length && defectCategories.length) {
      setLoading(false);
    }
  }, [submission, categories, stations, components, defectCategories]);

  if (notFound) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">Submission not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-brand-950 dark:text-white mb-6">Edit Submission</h1>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <SubmissionForm
          submission={{ ...submission!, createdAt: new Date(submission!.createdAt), updatedAt: new Date(submission!.updatedAt) }}
          workCategories={categories}
          workStations={stations}
          workComponents={components}
          defectCategories={defectCategories}
          existingDefects={existingDefects}
          editUrl={`/api/submissions/${id}`}
          backUrl="/submissions"
        />
      )}
    </div>
  );
}

