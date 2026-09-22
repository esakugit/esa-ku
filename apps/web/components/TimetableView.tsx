"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDraft } from "@/lib/useDraft";

type Department = { id: number; name: string; code: string };
type Cohort = { id: number; departmentId: number; entryYear: number; label: string };
type Course = { id: number; code: string; name: string };
type Entry = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  venue: string | null;
  lecturerName: string | null;
  course: Course;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function TimetableView({
  ownCohortId,
  ownCohortLabel,
  hasActiveBadge,
  canEditOwnCohort,
  ownDepartmentId,
  isAdmin = false,
}: {
  ownCohortId: number;
  ownCohortLabel: string;
  hasActiveBadge: boolean;
  canEditOwnCohort: boolean;
  ownDepartmentId: number;
  isAdmin?: boolean;
}) {
  const [selectedCohortId, setSelectedCohortId] = useState(ownCohortId);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [browseDeptId, setBrowseDeptId] = useState<string>(String(ownDepartmentId || ""));
  const [subscribedCourseIds, setSubscribedCourseIds] = useState<Set<number>>(new Set());

  // Load user's subscriptions so they can see which classes they are reminded of
  function loadSubscriptions() {
    fetch("/api/subscriptions")
      .then((r) => (r.ok ? r.json() : []))
      .then((subs: { subjectType: string; subjectId: number }[]) => {
        const courseIds = new Set(
          subs.filter((s) => s.subjectType === "course").map((s) => s.subjectId)
        );
        setSubscribedCourseIds(courseIds);
      })
      .catch(() => {});
  }

  function load(cohortId: number) {
    setError(null);
    fetch(`/api/timetable?cohortId=${cohortId}`).then(async (r) => {
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? "Couldn't load timetable.");
        setEntries([]);
        return;
      }
      setEntries(await r.json());
    });
  }

  useEffect(() => {
    load(selectedCohortId);
    loadSubscriptions();
  }, [selectedCohortId]);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (browseDeptId) {
      fetch(`/api/cohorts?departmentId=${browseDeptId}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCohorts(data);
          }
        })
        .catch(() => {});
    }
  }, [browseDeptId]);

  async function toggleCourseReminder(courseId: number) {
    const isSubbed = subscribedCourseIds.has(courseId);
    try {
      if (isSubbed) {
        await fetch(`/api/subscriptions?subjectType=course&subjectId=${courseId}`, {
          method: "DELETE",
        });
        setSubscribedCourseIds((prev) => {
          const next = new Set(prev);
          next.delete(courseId);
          return next;
        });
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjectType: "course", subjectId: courseId }),
        });
        if (res.ok) {
          setSubscribedCourseIds((prev) => new Set([...prev, courseId]));
        }
      }
    } catch {
      // ignore
    }
  }

  const canEditCurrentCohort =
    isAdmin || (canEditOwnCohort && selectedCohortId === ownCohortId);

  const selectedDepartmentId =
    Number(browseDeptId) ||
    cohorts.find((c) => c.id === selectedCohortId)?.departmentId ||
    ownDepartmentId;

  const currentCohortName =
    cohorts.find((c) => c.id === selectedCohortId)?.label ||
    (selectedCohortId === ownCohortId ? ownCohortLabel : `Cohort #${selectedCohortId}`);

  const byDay: Record<number, Entry[]> = {};
  for (const e of entries) (byDay[e.dayOfWeek] ??= []).push(e);

  return (
    <div className="space-y-6">
      {/* ─── Department & Intake Selector ─────────────────────────────────── */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Active Schedule
            </span>
            <p className="text-base font-bold text-ink">{currentCohortName}</p>
          </div>
          {!hasActiveBadge && !isAdmin && (
            <Link href="/profile" className="lock-chip self-start sm:self-auto !text-xs">
              Activate Badge to Browse Other Departments →
            </Link>
          )}
        </div>

        {(isAdmin || hasActiveBadge) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Department</label>
              <select
                className="field-input"
                value={browseDeptId}
                onChange={(e) => setBrowseDeptId(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Year / Intake</label>
              <select
                className="field-input"
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(Number(e.target.value))}
                disabled={!browseDeptId || cohorts.length === 0}
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ─── Add Class Entry Form (Admin or Class Rep) ────────────────────── */}
      {canEditCurrentCohort && (
        <AddEntryForm
          cohortId={selectedCohortId}
          departmentId={selectedDepartmentId}
          isAdmin={isAdmin}
          onAdded={() => load(selectedCohortId)}
        />
      )}

      {/* ─── Daily Timetable Breakdown ───────────────────────────────────── */}
      <div className="space-y-4">
        {DAYS.map((day, idx) => {
          const dayEntries = byDay[idx] ?? [];
          return (
            <div key={day} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {day}
              </h3>
              {dayEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-200 bg-white/50 p-4 text-xs text-neutral-400">
                  No lectures scheduled
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayEntries.map((e) => {
                    const isReminded = subscribedCourseIds.has(e.course.id);
                    return (
                      <div
                        key={e.id}
                        className="card p-4 flex flex-col justify-between hover:border-neutral-300 transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded bg-accent-soft px-2 py-0.5 font-mono text-xs font-bold text-accent">
                              {e.course.code}
                            </span>
                            <span className="text-xs font-bold text-ink">
                              {e.startTime.slice(0, 5)} – {e.endTime.slice(0, 5)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-ink leading-snug line-clamp-2">
                            {e.course.name}
                          </p>
                          <div className="pt-1 text-xs text-neutral-500 space-y-0.5">
                            {e.venue && (
                              <p className="flex items-center gap-1.5">
                                <span className="text-neutral-400">📍</span> {e.venue}
                              </p>
                            )}
                            {e.lecturerName && (
                              <p className="flex items-center gap-1.5">
                                <span className="text-neutral-400">👤</span> {e.lecturerName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                          {/* Toggle Reminder Bell */}
                          {(hasActiveBadge || isAdmin) ? (
                            <button
                              type="button"
                              onClick={() => toggleCourseReminder(e.course.id)}
                              className={`inline-flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 transition-colors ${
                                isReminded
                                  ? "bg-accent-soft text-accent hover:bg-accent/20"
                                  : "text-neutral-500 hover:bg-neutral-100"
                              }`}
                              title={
                                isReminded
                                  ? "You are receiving class reminder alerts for this unit"
                                  : "Click to receive reminders for this unit"
                              }
                            >
                              <span>{isReminded ? "🔔 Reminded" : "🔕 Remind me"}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-400">
                              Badge to enable alerts
                            </span>
                          )}

                          {/* Delete Entry */}
                          {canEditCurrentCohort && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Remove ${e.course.code} from this timetable?`)) {
                                  await fetch(`/api/timetable/${e.id}`, { method: "DELETE" });
                                  load(selectedCohortId);
                                }
                              }}
                              className="text-xs text-red-600 hover:underline font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddEntryForm({
  cohortId,
  departmentId,
  isAdmin,
  onAdded,
}: {
  cohortId: number;
  departmentId: number;
  isAdmin: boolean;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");

  const [form, setForm, clearDraft] = useDraft(`timetable-entry-${cohortId}`, {
    courseId: "",
    dayOfWeek: "0",
    startTime: "08:00",
    endTime: "10:00",
    venue: "",
    lecturerName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && departmentId) {
      fetch(`/api/courses?departmentId=${departmentId}`)
        .then((r) => r.json())
        .then((rows) => {
          if (Array.isArray(rows)) {
            setCourses(rows);
            if (rows.length > 0 && !form.courseId) {
              setForm((f) => ({ ...f, courseId: String(rows[0].id) }));
            }
          }
        })
        .catch(() => {});
    }
  }, [open, departmentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let finalCourseId = Number(form.courseId);

      // If creating a course on the fly (for admin)
      if (isCreatingCourse || courses.length === 0) {
        if (!newCourseCode.trim() || !newCourseName.trim()) {
          setError("Please provide both course code and course name.");
          setLoading(false);
          return;
        }

        const courseRes = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departmentId,
            code: newCourseCode.trim().toUpperCase(),
            name: newCourseName.trim(),
          }),
        });

        if (!courseRes.ok) {
          const errData = await courseRes.json().catch(() => ({}));
          setError(errData.error ?? "Failed to create course unit.");
          setLoading(false);
          return;
        }

        const createdCourse = await courseRes.json();
        finalCourseId = createdCourse.id;
      }

      if (!finalCourseId) {
        setError("Please select or add a course unit.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohortId,
          courseId: finalCourseId,
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          venue: form.venue || null,
          lecturerName: form.lecturerName || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save timetable entry.");
        return;
      }

      clearDraft();
      setIsCreatingCourse(false);
      setNewCourseCode("");
      setNewCourseName("");
      setOpen(false);
      onAdded();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 space-y-3 border-accent/30 bg-accent-soft/30">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-primary !text-xs"
        >
          {open ? "Cancel" : "+ Add Class to This Schedule"}
        </button>
        {open && (
          <span className="text-xs text-neutral-500 font-medium">
            Adding to selected cohort
          </span>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="card p-5 space-y-4 bg-white">
          {/* Course Unit Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label !mb-0">Course Unit</label>
              {isAdmin && courses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCourse((v) => !v)}
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  {isCreatingCourse ? "Select existing unit" : "+ Create new course code"}
                </button>
              )}
            </div>

            {isCreatingCourse || courses.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  className="field-input font-mono uppercase"
                  placeholder="Code (e.g. EEE 301)"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  required
                />
                <input
                  className="field-input sm:col-span-2"
                  placeholder="Unit Name (e.g. Electromagnetic Fields)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  required
                />
              </div>
            ) : (
              <select
                className="field-input font-semibold"
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                required
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Day & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Day</label>
              <select
                className="field-input font-semibold"
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Start Time</label>
              <input
                type="time"
                className="field-input font-semibold"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="field-label">End Time</label>
              <input
                type="time"
                className="field-input font-semibold"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Venue & Lecturer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Venue / Lecture Hall</label>
              <input
                className="field-input"
                placeholder="e.g. ELB 014 or Civil Lab"
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">Lecturer Name</label>
              <input
                className="field-input"
                placeholder="e.g. Dr. Kamau"
                value={form.lecturerName}
                onChange={(e) => setForm((f) => ({ ...f, lecturerName: e.target.value }))}
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !text-sm"
          >
            {loading ? "Adding Class..." : "Add Class to Timetable"}
          </button>
        </form>
      )}
    </div>
  );
}
