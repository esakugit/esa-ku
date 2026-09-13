"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClubEventManager({ clubId }: { clubId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
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
        body: JSON.stringify({ clubId, title, description, location, startAt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setTitle("");
      setDescription("");
      setLocation("");
      setStartAt("");
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="field-input"
            rows={3}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="field-input"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <div>
            <label className="field-label">Starts</label>
            <input
              required
              type="datetime-local"
              className="field-input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
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
