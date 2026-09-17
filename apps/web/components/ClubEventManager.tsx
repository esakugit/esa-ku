"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraft } from "@/lib/useDraft";

type Draft = {
  title: string;
  description: string;
  location: string;
  startAt: string;
  registrationUrl: string;
  coverImageBlobUrl: string;
  isFeatured: boolean;
};

export function ClubEventManager({ clubId }: { clubId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm, clearDraft] = useDraft<Draft>(`club-event-${clubId}`, {
    title: "",
    description: "",
    location: "",
    startAt: "",
    registrationUrl: "",
    coverImageBlobUrl: "",
    isFeatured: false,
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
          <div>
            <label className="field-label">RSVP / Registration Link (Google Form, etc.)</label>
            <input
              type="url"
              className="field-input"
              placeholder="https://forms.gle/..."
              value={form.registrationUrl}
              onChange={(e) => setForm((f) => ({ ...f, registrationUrl: e.target.value }))}
            />
          </div>
          <div>
            <label className="field-label">Event Flyer / Banner Image URL</label>
            <input
              type="url"
              className="field-input"
              placeholder="https://... (image URL)"
              value={form.coverImageBlobUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverImageBlobUrl: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFeatured"
              className="h-4 w-4 rounded border-neutral-300 text-accent focus:ring-accent"
              checked={form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
            />
            <label htmlFor="isFeatured" className="text-xs font-semibold text-neutral-700 cursor-pointer">
              Feature this event prominently on the Platform Homepage (e.g. November Summit)
            </label>
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
