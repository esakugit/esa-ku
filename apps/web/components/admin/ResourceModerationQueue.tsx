"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type PendingResource = {
  id: number;
  title: string;
  type: string;
  blobUrl: string;
  academicYear: string | null;
  department: { name: string };
  course: { code: string } | null;
  uploader: { fullName: string; email: string };
};

export function ResourceModerationQueue() {
  const [rows, setRows] = useState<PendingResource[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { success, error, info } = useToast();

  const load = () =>
    fetch("/api/resources/pending")
      .then((r) => r.json())
      .then((rows) => {
        setRows(rows);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  async function decide(id: number, decision: "approve" | "reject") {
    const title = rows.find((r) => r.id === id)?.title ?? "Resource";
    const res = await fetch(`/api/resources/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      if (decision === "approve") success("Resource published", `"${title}" is now visible to students.`);
      else info("Resource rejected", `"${title}" was rejected.`);
    } else {
      error("That didn't go through", "Please try again.");
    }
    load();
  }

  if (loaded && rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
        No uploads waiting for review.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="card p-4">
          <p className="text-sm font-semibold text-ink">{r.title}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {r.department.name}
            {r.course ? ` · ${r.course.code}` : ""}
            {r.academicYear ? ` · ${r.academicYear}` : ""} · by {r.uploader.fullName}
          </p>
          <div className="mt-3 flex gap-2">
            <a href={r.blobUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 text-center">
              Preview
            </a>
            <button onClick={() => decide(r.id, "approve")} className="btn-primary flex-1">
              Approve
            </button>
            <button onClick={() => decide(r.id, "reject")} className="text-sm text-red-600 hover:underline">
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
