"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

type Announcement = {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: "normal" | "urgent";
  pinned: boolean;
  actionUrl: string | null;
  publishedAt: string;
  author?: { fullName: string } | null;
};

export function AnnouncementsTab() {
  const { success, error } = useToast();
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "normal" as "normal" | "urgent",
    pinned: false,
    actionUrl: "",
  });

  const load = () => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setList(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        error(data.error || "Failed to publish announcement.");
        return;
      }

      success("Announcement published successfully!");
      setForm({
        title: "",
        content: "",
        category: "General",
        priority: "normal",
        pinned: false,
        actionUrl: "",
      });
      setOpenCreate(false);
      load();
    } catch {
      error("Error creating announcement.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        success("Announcement deleted.");
        setList((prev) => prev.filter((a) => a.id !== id));
      } else {
        error("Failed to delete.");
      }
    } catch {
      error("Error deleting announcement.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Official Notices & Announcements</h2>
          <p className="text-xs text-neutral-500">
            Publish circulars, timetable notices, bursaries, and society announcements directly to students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenCreate(!openCreate)}
          className="btn-primary !py-2 !px-3.5 !text-xs self-start sm:self-auto"
        >
          {openCreate ? "Close Form" : "+ Create Announcement"}
        </button>
      </div>

      {openCreate && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 border-accent/40 bg-white">
          <h3 className="text-sm font-bold text-ink">New Circular / Announcement</h3>

          <div>
            <label className="field-label">Notice Title</label>
            <input
              required
              className="field-input font-medium"
              placeholder="e.g. End of Semester Examination Circular 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Category</label>
              <select
                className="field-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="General">General Notice</option>
                <option value="Academic">Academic & Exams</option>
                <option value="Bursaries">Bursaries & Grants</option>
                <option value="Events">Events & Conferences</option>
                <option value="Dean Circular">Dean&apos;s Circular</option>
              </select>
            </div>

            <div>
              <label className="field-label">Priority Level</label>
              <select
                className="field-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as "normal" | "urgent" })}
              >
                <option value="normal">Standard Priority</option>
                <option value="urgent">🔴 Urgent / High Priority</option>
              </select>
            </div>

            <div>
              <label className="field-label">Action Link (Optional)</label>
              <input
                type="url"
                className="field-input text-xs font-mono"
                placeholder="https://... (PDF, form, etc.)"
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Announcement Content</label>
            <textarea
              required
              rows={4}
              className="field-input text-xs"
              placeholder="Write the full announcement text here..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              className="h-4 w-4 rounded border-neutral-300 text-accent focus:ring-accent"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            />
            <label htmlFor="pinned" className="text-xs font-semibold text-neutral-700 cursor-pointer">
              Pin to the top of all notice boards
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary !py-1.5 !px-4 !text-xs font-semibold"
            >
              {submitting ? "Publishing..." : "Publish Announcement"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-neutral-500">Loading notices...</div>
      ) : list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-neutral-500">
          No announcements have been published yet. Use the button above to publish your first notice.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <article key={a.id} className="card p-4 hover:border-neutral-300 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      📌 Pinned
                    </span>
                  )}
                  {a.priority === "urgent" && (
                    <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      🔴 Urgent
                    </span>
                  )}
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                    {a.category}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {new Date(a.publishedAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete Notice
                </button>
              </div>

              <h3 className="text-base font-bold text-ink">{a.title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{a.content}</p>

              {a.actionUrl && (
                <div className="pt-2">
                  <a
                    href={a.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    View Document / External Link →
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
