"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
}: {
  ownCohortId: number;
  ownCohortLabel: string;
  hasActiveBadge: boolean;
  canEditOwnCohort: boolean;
  ownDepartmentId: number;
}) {
  const [selectedCohortId, setSelectedCohortId] = useState(ownCohortId);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [browseDeptId, setBrowseDeptId] = useState("");

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
  }, [selectedCohortId]);

  useEffect(() => {
    if (browsing && departments.length === 0) {
      fetch("/api/departments").then((r) => r.json()).then(setDepartments);
    }
  }, [browsing]);

  useEffect(() => {
    if (browseDeptId) {
      fetch(`/api/cohorts?departmentId=${browseDeptId}`).then((r) => r.json()).then(setCohorts);
    }
  }, [browseDeptId]);

  const byDay: Record<number, Entry[]> = {};
  for (const e of entries) (byDay[e.dayOfWeek] ??= []).push(e);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">
          {selectedCohortId === ownCohortId ? ownCohortLabel : "Browsing another cohort"}
        </p>
        {hasActiveBadge ? (
          <button onClick={() => setBrowsing((v) => !v)} className="text-sm text-accent">
            {browsing ? "Close" : "Browse other cohorts"}
          </button>
        ) : (
          <Link href="/profile" className="lock-chip">
            Badge to browse other cohorts
          </Link>
        )}
      </div>

      {browsing && (
        <div className="card mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <select className="field-input" value={browseDeptId} onChange={(e) => setBrowseDeptId(e.target.value)}>
            <option value="">Choose department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="field-input"
            value={selectedCohortId}
            onChange={(e) => setSelectedCohortId(Number(e.target.value))}
            disabled={!browseDeptId}
          >
            <option value={ownCohortId}>Choose intake</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {canEditOwnCohort && selectedCohortId === ownCohortId && (
        <AddEntryForm cohortId={ownCohortId} departmentId={ownDepartmentId} onAdded={() => load(ownCohortId)} />
      )}

      <div className="space-y-4">
        {DAYS.map((day, idx) => (
          <div key={day}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{day}</h3>
            {(byDay[idx] ?? []).length === 0 ? (
              <p className="text-sm text-neutral-300">No classes</p>
            ) : (
              <ul className="space-y-2">
                {(byDay[idx] ?? []).map((e) => (
                  <li key={e.id} className="card flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {e.course.code} · {e.course.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {e.startTime.slice(0, 5)}–{e.endTime.slice(0, 5)}
                        {e.venue ? ` · ${e.venue}` : ""}
                        {e.lecturerName ? ` · ${e.lecturerName}` : ""}
                      </p>
                    </div>
                    {canEditOwnCohort && selectedCohortId === ownCohortId && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/timetable/${e.id}`, { method: "DELETE" });
                          load(ownCohortId);
                        }}
                        className="text-xs text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddEntryForm({
  cohortId,
  departmentId,
  onAdded,
}: {
  cohortId: number;
  departmentId: number;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [venue, setVenue] = useState("");
  const [lecturerName, setLecturerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch(`/api/courses?departmentId=${departmentId}`).then((r) => r.json()).then((rows) => {
        setCourses(rows);
        if (rows[0]) setCourseId(String(rows[0].id));
      });
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!courseId) {
      setError("Add a course to this department first (Admin console).");
      return;
    }
    const res = await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cohortId,
        courseId: Number(courseId),
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        venue,
        lecturerName,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Failed");
    setVenue("");
    setLecturerName("");
    onAdded();
  }

  return (
    <div className="card mb-4 p-4">
      <button onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-accent">
        {open ? "Cancel" : "+ Add a class"}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <select className="field-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <select className="field-input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <input type="time" className="field-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input type="time" className="field-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <input className="field-input" placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <input
            className="field-input"
            placeholder="Lecturer"
            value={lecturerName}
            onChange={(e) => setLecturerName(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full">Add to timetable</button>
        </form>
      )}
    </div>
  );
}
