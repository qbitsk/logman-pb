"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SubmissionDetail, type SubmissionDetailData } from "@/components/SubmissionDetail";

export default function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [submission, setSubmission] = useState<SubmissionDetailData | null>(null);
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
        const { existingDefects: _ignored, workCategoryId: _wc, workStationId: _ws, userId: _uid, ...rest } = data;
        setSubmission(rest);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (notFound || !submission) {
    return (
      <div className="max-w-2xl card text-center py-16">
        <p className="text-gray-400">Submission not found.</p>
      </div>
    );
  }

  return (
    <SubmissionDetail
      submission={submission}
      backUrl="/admin/submissions"
      editUrl={`/admin/submissions/${id}/edit`}
    />
  );
}

