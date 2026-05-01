"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";

type Submission = {
  id: string;
  workProductId: string;
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

type WorkProduct = { id: string; name: string };
type WorkStation = { id: string; name: string; workProductId: string };
type WorkComponent = { id: string; name: string; workProductId: string };
type WorkDefect = { id: string; name: string; type: "unit" | "component"; workProductId: string; workComponentId: string | null };
type ExistingDefect = { workDefectId: string; units: number };

export default function AdminSubmissionEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [existingDefects, setExistingDefects] = useState<ExistingDefect[]>([]);
  const [workProducts, setWorkProducts] = useState<WorkProduct[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [components, setComponents] = useState<WorkComponent[]>([]);
  const [workDefects, setWorkDefects] = useState<WorkDefect[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const { existingDefects: defects, ...sub } = data;
        setSubmission(sub);
        setExistingDefects(defects ?? []);
      });
  }, [id]);

  useEffect(() => {
    fetch("/api/work-products").then((r) => r.json()).then(setWorkProducts);
  }, []);

  useEffect(() => {
    fetch("/api/work-stations").then((r) => r.json()).then(setStations);
  }, []);

  useEffect(() => {
    fetch("/api/work-components").then((r) => r.json()).then(setComponents);
  }, []);

  useEffect(() => {
    fetch("/api/work-defects").then((r) => r.json()).then(setWorkDefects);
  }, []);

  useEffect(() => {
    if (submission && workProducts.length && stations.length && components.length && workDefects.length) {
      setLoading(false);
    }
  }, [submission, workProducts, stations, components, workDefects]);

  if (notFound) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">Submission not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950 dark:text-white">Edit Submission</h1>
        {submission && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">#{submission.id}</p>}
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">Loading…</p>
        </div>
      ) : (
        <SubmissionForm
          submission={{ ...submission!, createdAt: new Date(submission!.createdAt), updatedAt: new Date(submission!.updatedAt) }}
          workProducts={workProducts}
          workStations={stations}
          workComponents={components}
          workDefects={workDefects}
          existingDefects={existingDefects}
          backUrl="/admin/submissions"
          allowStatusChange
        />
      )}
    </div>
  );
}
