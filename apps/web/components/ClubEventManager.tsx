"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraft } from "@/lib/useDraft";

type Draft = { title: string; description: string; location: string; startAt: string };

export function ClubEventManager({ clubId }: { clubId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm, clearDraft] = useDraft<Draft>(`club-event-${clubId}`, {
    title: "",
    description: "",
    location: "",
    startAt: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      clearDraft();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6 p-4">
      <button onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-accent">
        {open ? "Cancel" : "+ Post a new event"}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <input
            required
            className="field-input"
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="field-input"
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className="field-input"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <div>
            <label className="field-label">Starts</label>
            <input
              required
              type="datetime-local"
              className="field-input"
              value={form.startAt}
              onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Posting..." : "Post event"}
          </button>
        </form>
      )}
    </div>
  );
}
