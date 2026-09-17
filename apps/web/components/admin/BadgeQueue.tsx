"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type PendingBadge = {
  id: number;
  paymentReference: string;
  academicYear: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
};

export function BadgeQueue() {
  const [rows, setRows] = useState<PendingBadge[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState(false);
  const { success, error, info } = useToast();

  const load = () =>
    fetch("/api/badges")
      .then((r) => r.json())
      .then((rows) => {
        setRows(rows);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  async function decide(id: number, decision: "approve" | "reject") {
    const student = rows.find((b) => b.id === id)?.user.fullName ?? "Student";
    setBusyId(id);
    const res = await fetch(`/api/badges/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: notes[id] }),
    });
    setBusyId(null);
    if (res.ok) {
      if (decision === "approve") success("Badge approved", `${student}'s Badge is now active.`);
      else info("Badge rejected", `${student} has been notified.`);
    } else {
      error("That didn't go through", "Please try again.");
    }
    load();
  }

  if (loaded && rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
        No pending Badge applications — you're all caught up.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((b) => (
        <li key={b.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{b.user.fullName}</p>
              <p className="text-xs text-neutral-500">{b.user.email}</p>
            </div>
            <span className="lock-chip">{b.academicYear}</span>
          </div>
          <p className="mt-3 rounded-md bg-neutral-100 px-3 py-2 font-mono text-sm text-ink">
            {b.paymentReference}
          </p>
          <input
            className="field-input mt-3"
            placeholder="Optional note (shown to student if rejected)"
            value={notes[b.id] ?? ""}
            onChange={(e) => setNotes((s) => ({ ...s, [b.id]: e.target.value }))}
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={busyId === b.id}
              onClick={() => decide(b.id, "approve")}
              className="btn-primary flex-1"
            >
              Approve
            </button>
            <button
              disabled={busyId === b.id}
              onClick={() => decide(b.id, "reject")}
              className="btn-secondary flex-1"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
