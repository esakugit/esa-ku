"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type Club = { id: number; name: string };

type EventItem = {
  id: number;
  clubId: number;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  coverImageBlobUrl: string | null;
  registrationUrl: string | null;
  isFeatured: boolean;
  club: { name: string };
};

export function EventsTab() {
  const { success, error } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    clubId: 1,
    title: "",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
    coverImageBlobUrl: "",
    registrationUrl: "",
    isFeatured: false,
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/events?scope=all").then((r) => r.json()),
      fetch("/api/clubs").then((r) => r.json()),
    ])
      .then(([eventsData, clubsData]) => {
        if (Array.isArray(eventsData)) setEvents(eventsData);
        if (Array.isArray(clubsData)) {
          setClubs(clubsData);
          if (clubsData.length > 0) setForm((f) => ({ ...f, clubId: clubsData[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(event: EventItem) {
    setEditingId(event.id);
    setForm({
      clubId: event.clubId,
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : "",
      endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : "",
      coverImageBlobUrl: event.coverImageBlobUrl || "",
      registrationUrl: event.registrationUrl || "",
      isFeatured: event.isFeatured,
    });
    setOpenCreate(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/events/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            location: form.location,
            startAt: form.startAt,
            endAt: form.endAt || null,
            coverImageBlobUrl: form.coverImageBlobUrl,
            registrationUrl: form.registrationUrl,
            isFeatured: form.isFeatured,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          error(data.error || "Failed to update event.");
          return;
        }

        success("Event updated successfully!");
      } else {
        // Create new
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const data = await res.json();
          error(data.error || "Failed to post event.");
          return;
        }

        success("Event created successfully!");
      }

      setOpenCreate(false);
      setEditingId(null);
      loadData();
    } catch {
      error("Error saving event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to cancel / delete this event?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        success("Event deleted.");
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        error("Failed to delete event.");
      }
    } catch {
      error("Error deleting event.");
    }
  }

  async function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPoster(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", "events");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setForm((f) => ({ ...f, coverImageBlobUrl: data.url }));
      success("Poster uploaded successfully!");
    } catch (err: any) {
      error(err.message || "Could not upload poster.");
    } finally {
      setUploadingPoster(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Engineering Events & Symposia Management</h2>
          <p className="text-xs text-neutral-500">
            Create, edit, feature, and manage all events across ESA and affiliated engineering clubs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm({
              clubId: clubs[0]?.id || 1,
              title: "",
              description: "",
              location: "",
              startAt: "",
              endAt: "",
              coverImageBlobUrl: "",
              registrationUrl: "",
              isFeatured: false,
            });
            setOpenCreate(!openCreate);
          }}
          className="btn-primary !py-2 !px-3.5 !text-xs self-start sm:self-auto"
        >
          {openCreate ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {openCreate && (
        <form onSubmit={handleSave} className="card p-5 space-y-4 border-accent/40 bg-white">
          <h3 className="text-sm font-bold text-ink">
            {editingId ? "Edit Event" : "Create New Event"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Host Organization / Club</label>
              <select
                disabled={Boolean(editingId)}
                className="field-input"
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: Number(e.target.value) })}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Event Title</label>
              <input
                required
                className="field-input font-medium"
                placeholder="e.g. Annual Engineering Summit 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Location / Venue</label>
              <input
                className="field-input"
                placeholder="e.g. 8-4-4 Amphitheatre"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Start Date & Time</label>
              <input
                required
                type="datetime-local"
                className="field-input"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">End Date & Time</label>
              <input
                type="datetime-local"
                className="field-input"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">RSVP / Registration Link (or mailto / form)</label>
              <input
                type="text"
                className="field-input text-xs font-mono"
                placeholder="https://forms.gle/... or mailto:esa.kenyattauniv@gmail.com"
                value={form.registrationUrl}
                onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Event Poster / Flyer</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field-input text-xs font-mono flex-1"
                  placeholder="/events/sustainability-dinner-2026.jpg or image URL"
                  value={form.coverImageBlobUrl}
                  onChange={(e) => setForm({ ...form, coverImageBlobUrl: e.target.value })}
                />
                <label className="btn-secondary !text-xs !py-1.5 shrink-0 cursor-pointer">
                  {uploadingPoster ? "Uploading..." : "📁 Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPoster}
                    onChange={handlePosterUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {form.coverImageBlobUrl && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 flex items-center gap-4">
              <img
                src={form.coverImageBlobUrl}
                alt="Poster preview"
                className="h-28 w-20 rounded-lg object-cover shadow-sm border border-neutral-200"
              />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-ink">Poster Preview</p>
                <p className="text-neutral-500 truncate max-w-md">{form.coverImageBlobUrl}</p>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverImageBlobUrl: "" }))}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove Poster
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Event Description</label>
            <textarea
              rows={3}
              className="field-input text-xs"
              placeholder="Provide event details, schedule, and guest speakers..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="eventFeatured"
              className="h-4 w-4 rounded border-neutral-300 text-accent focus:ring-accent"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            <label htmlFor="eventFeatured" className="text-xs font-semibold text-neutral-700 cursor-pointer">
              Pin as Featured Flagship Event on Homepage
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpenCreate(false);
                setEditingId(null);
              }}
              className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !py-1.5 !px-4 !text-xs font-semibold"
            >
              {saving ? "Saving..." : editingId ? "Update Event" : "Post Event"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-neutral-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card p-8 text-center text-sm text-neutral-500">
          No events created yet. Use the button above to add an event.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <article key={e.id} className="card p-4 hover:border-neutral-300 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {e.isFeatured && (
                    <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      ★ Featured Spotlight
                    </span>
                  )}
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                    {e.club.name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(e.startAt).toLocaleDateString("en-KE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(e)}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Edit
                  </button>
                  <span className="text-neutral-300">·</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(e.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                {e.coverImageBlobUrl && (
                  <img
                    src={e.coverImageBlobUrl}
                    alt={e.title}
                    className="h-20 w-16 rounded-md object-cover border border-neutral-200 shrink-0"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <h3 className="text-base font-bold text-ink">{e.title}</h3>
                  {e.description && <p className="text-xs text-neutral-600 line-clamp-2">{e.description}</p>}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                    {e.location && <span>📍 {e.location}</span>}
                    {e.registrationUrl && (
                      <span className="text-accent font-medium">✓ RSVP Link Active</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
