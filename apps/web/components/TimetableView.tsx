"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatTimeRange(start: string, end: string): string {
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);
  // Calculate approximate duration
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const dur = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`) : `${mins} mins`;
  return `${s} – ${e} (${dur})`;
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [browseDeptId, setBrowseDeptId] = useState<string>(String(ownDepartmentId || ""));
  const [subscribedCourseIds, setSubscribedCourseIds] = useState<Set<number>>(new Set());

  // Interactive Course Filter and Search Query
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");

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
    setLoading(true);
    fetch(`/api/timetable?cohortId=${cohortId}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setError(d.error ?? "Couldn't load timetable.");
          setEntries([]);
          return;
        }
        setEntries(await r.json());
      })
      .catch(() => {
        setError("Network error loading schedule.");
      })
      .finally(() => {
        setLoading(false);
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
        .then((data: Cohort[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setCohorts(data);
            // If current selected cohort does not belong to the newly chosen department,
            // switch to the first cohort (Year 1) of that department.
            if (!data.some((c) => c.id === selectedCohortId)) {
              setSelectedCohortId(data[0].id);
            }
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

  const currentCohort = cohorts.find((c) => c.id === selectedCohortId);
  const currentCohortName =
    currentCohort?.label ||
    (selectedCohortId === ownCohortId ? ownCohortLabel : `Cohort #${selectedCohortId}`);

  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);

  // Extract all unique courses for this cohort
  const uniqueCourses = useMemo(() => {
    const map = new Map<number, Course>();
    for (const e of entries) {
      if (!map.has(e.course.id)) {
        map.set(e.course.id, e.course);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [entries]);

  // Filter entries based on search query and course filter
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (selectedCourseFilter !== "ALL" && e.course.code !== selectedCourseFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = e.course.code.toLowerCase().includes(q);
        const matchesName = e.course.name.toLowerCase().includes(q);
        const matchesVenue = (e.venue || "").toLowerCase().includes(q);
        const matchesLecturer = (e.lecturerName || "").toLowerCase().includes(q);
        return matchesCode || matchesName || matchesVenue || matchesLecturer;
      }
      return true;
    });
  }, [entries, selectedCourseFilter, searchQuery]);

  // Group by day of week
  const byDay: Record<number, Entry[]> = {};
  for (const e of filteredEntries) (byDay[e.dayOfWeek] ??= []).push(e);

  return (
    <div className="space-y-6">
      {/* ─── 1. Department & Academic Year Navigation ─────────────────────── */}
      <div className="card p-5 space-y-4 border-neutral-200/80 shadow-xs">
        {/* Top bar: Active Schedule & Jump to My Schedule */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              {activeDepartment ? `${activeDepartment.name} (${activeDepartment.code})` : "Engineering Department"}
            </span>
            <h2 className="text-xl font-black tracking-tight text-ink">
              {currentCohortName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCohortId !== ownCohortId && ownCohortId && (
              <button
                type="button"
                onClick={() => {
                  setBrowseDeptId(String(ownDepartmentId));
                  setSelectedCohortId(ownCohortId);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition-all cursor-pointer"
              >
                <span>📍 Jump to My Cohort</span>
              </button>
            )}

            {!hasActiveBadge && !isAdmin && (
              <Link href="/profile" className="lock-chip !text-xs">
                Activate Badge for Push Reminders →
              </Link>
            )}
          </div>
        </div>

        {/* Department Dropdown & Year Selection */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Department Select */}
            <div className="sm:col-span-5">
              <label className="field-label text-xs font-bold uppercase tracking-wider text-neutral-500">
                1. Select Department
              </label>
              <select
                className="field-input font-medium"
                value={browseDeptId}
                onChange={(e) => setBrowseDeptId(e.target.value)}
              >
                <option value="">Choose Engineering Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Tabs (Year 1 to Year 5) */}
            <div className="sm:col-span-7">
              <label className="field-label text-xs font-bold uppercase tracking-wider text-neutral-500">
                2. Select Academic Year
              </label>
              {cohorts.length > 0 ? (
                <div className="grid grid-cols-5 gap-1.5">
                  {cohorts.map((c) => {
                    const isSelected = c.id === selectedCohortId;
                    const isUserCohort = c.id === ownCohortId;
                    const shortLabel = c.label.split(" ")[0] + " " + (c.label.split(" ")[1] || "");
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCohortId(c.id)}
                        className={`rounded-lg px-2 py-2 text-center text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-accent text-white shadow-xs"
                            : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer"
                        }`}
                        title={c.label}
                      >
                        <span className="block truncate">{shortLabel}</span>
                        {isUserCohort && (
                          <span className={`block text-[9px] font-semibold ${isSelected ? "text-white/80" : "text-accent"}`}>
                            (My Class)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-neutral-200 p-2 text-xs text-neutral-400">
                  Select a department to view academic years
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 2. Course Unit Search & Interactive Filter Bar ─────────────── */}
        <div className="border-t border-neutral-100 pt-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by unit code, name, lecturer, or room..."
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50/70 pl-8 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-400 hover:text-neutral-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total lectures count */}
            <div className="text-xs font-semibold text-neutral-500">
              {loading ? (
                <span>Loading lectures...</span>
              ) : (
                <span>
                  {filteredEntries.length} {filteredEntries.length === 1 ? "lecture" : "lectures"} scheduled
                  {uniqueCourses.length > 0 && ` across ${uniqueCourses.length} units`}
                </span>
              )}
            </div>
          </div>

          {/* Unit Filter Pills */}
          {uniqueCourses.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400 mr-1">
                Units:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCourseFilter("ALL")}
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedCourseFilter === "ALL"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                All ({uniqueCourses.length})
              </button>
              {uniqueCourses.map((c) => {
                const isActive = selectedCourseFilter === c.code;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourseFilter(isActive ? "ALL" : c.code)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent text-white shadow-xs"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
                    }`}
                    title={c.name}
                  >
                    <span className="font-mono font-bold">{c.code}</span>
                    <span className="hidden sm:inline text-[11px] text-neutral-500 font-normal ml-1">
                      · {c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ─── 3. Add Class Entry Form (Admin or Class Rep) ──────────────────── */}
      {canEditCurrentCohort && (
        <AddEntryForm
          cohortId={selectedCohortId}
          departmentId={selectedDepartmentId}
          isAdmin={isAdmin}
          onAdded={() => load(selectedCohortId)}
        />
      )}

      {/* ─── 4. Daily Timetable Breakdown (Monday through Friday/Sunday) ───── */}
      <div className="space-y-5">
        {DAYS.slice(0, 5).concat(DAYS.slice(5).filter((_, idx) => (byDay[idx + 5] ?? []).length > 0)).map((day, idx) => {
          const dayEntries = byDay[idx] ?? [];
          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                  <span>{day}</span>
                  {dayEntries.length > 0 && (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.2 text-[10px] font-bold text-neutral-700">
                      {dayEntries.length} {dayEntries.length === 1 ? "Class" : "Classes"}
                    </span>
                  )}
                </h3>
              </div>

              {dayEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-white/40 p-4 text-center text-xs text-neutral-400">
                  {selectedCourseFilter !== "ALL" || searchQuery
                    ? `No classes matching filter for ${day}`
                    : `No lectures scheduled on ${day}`}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayEntries.map((e) => {
                    const isReminded = subscribedCourseIds.has(e.course.id);
                    return (
                      <div
                        key={e.id}
                        className="card p-4.5 flex flex-col justify-between hover:border-neutral-300 hover:shadow-md transition-all bg-white"
                      >
                        <div className="space-y-2">
                          {/* Unit Code & Timing */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-md bg-accent-soft px-2.5 py-1 font-mono text-xs font-black text-accent border border-accent/20">
                              {e.course.code}
                            </span>
                            <span className="text-xs font-bold text-ink whitespace-nowrap">
                              🕒 {formatTimeRange(e.startTime, e.endTime)}
                            </span>
                          </div>

                          {/* Unit Title */}
                          <h4 className="text-sm font-bold text-ink leading-snug line-clamp-2">
                            {e.course.name}
                          </h4>

                          {/* Venue & Lecturer Info */}
                          <div className="pt-1 text-xs text-neutral-600 space-y-1">
                            {e.venue ? (
                              <p className="flex items-center gap-1.5 font-medium">
                                <span className="text-accent">📍</span>
                                <span className="text-neutral-800 font-semibold">{e.venue}</span>
                              </p>
                            ) : (
                              <p className="text-neutral-400 italic">Venue TBA</p>
                            )}

                            {e.lecturerName && (
                              <p className="flex items-center gap-1.5">
                                <span className="text-neutral-400">👤</span>
                                <span>{e.lecturerName}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Actions: Remind Me & Delete */}
                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                          {/* Toggle Reminder Bell */}
                          {hasActiveBadge || isAdmin ? (
                            <button
                              type="button"
                              onClick={() => toggleCourseReminder(e.course.id)}
                              className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                                isReminded
                                  ? "bg-accent-soft text-accent border border-accent/30 hover:bg-accent/20"
                                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                              }`}
                              title={
                                isReminded
                                  ? "Class reminders active: you will be alerted prior to lecture"
                                  : "Click to get automated push reminders for this unit"
                              }
                            >
                              <span>{isReminded ? "🔔 Alert On" : "🔕 Remind me"}</span>
                            </button>
                          ) : (
                            <Link
                              href="/profile"
                              className="text-[10px] font-semibold text-neutral-500 hover:text-accent hover:underline flex items-center gap-1"
                              title="Activate your membership badge to receive class alerts"
                            >
                              <span>🔒</span>
                              <span>Badge for reminders</span>
                            </Link>
                          )}

                          {/* Delete Entry (Class Rep / Admin) */}
                          {canEditCurrentCohort && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Remove ${e.course.code} (${day}) from this timetable?`)) {
                                  await fetch(`/api/timetable/${e.id}`, { method: "DELETE" });
                                  load(selectedCohortId);
                                }
                              }}
                              className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold cursor-pointer"
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
    endTime: "11:00",
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

      // If creating a course on the fly (for admin or class rep)
      if (isCreatingCourse || courses.length === 0) {
        if (!newCourseCode.trim() || !newCourseName.trim()) {
          setError("Please provide both unit code and course name.");
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
          <span className="text-xs text-neutral-600 font-medium">
            Class Rep / Admin Editor
          </span>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="card p-5 space-y-4 bg-white">
          {/* Course Unit Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="field-label !mb-0">Course Unit</label>
              {courses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCourse((v) => !v)}
                  className="text-xs text-accent font-semibold hover:underline cursor-pointer"
                >
                  {isCreatingCourse ? "← Select from existing units" : "+ Register new unit code"}
                </button>
              )}
            </div>

            {isCreatingCourse || courses.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  className="field-input font-mono uppercase font-bold"
                  placeholder="Unit Code (e.g. EEE 301)"
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
              <label className="field-label">Day of Week</label>
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
              <label className="field-label">Lecture Venue / Lab</label>
              <input
                className="field-input"
                placeholder="e.g. ELB 015, 8-4-4 Room 02, Mech Workshop"
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">Lecturer / Instructor</label>
              <input
                className="field-input"
                placeholder="e.g. Prof. Ndiritu, Dr. Eng. Kariuki"
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
