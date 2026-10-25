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
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Deterministic pastel palette generator for course units
const UNIT_PALETTES = [
  {
    border: "border-l-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    accent: "#3B82F6",
    softBg: "bg-blue-500/5",
  },
  {
    border: "border-l-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accent: "#10B981",
    softBg: "bg-emerald-500/5",
  },
  {
    border: "border-l-purple-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    accent: "#8B5CF6",
    softBg: "bg-purple-500/5",
  },
  {
    border: "border-l-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    accent: "#F59E0B",
    softBg: "bg-amber-500/5",
  },
  {
    border: "border-l-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    accent: "#F43F5E",
    softBg: "bg-rose-500/5",
  },
  {
    border: "border-l-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    accent: "#6366F1",
    softBg: "bg-indigo-500/5",
  },
  {
    border: "border-l-teal-500",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    accent: "#14B8A6",
    softBg: "bg-teal-500/5",
  },
  {
    border: "border-l-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    accent: "#06B6D4",
    softBg: "bg-cyan-500/5",
  },
];

function getUnitPalette(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % UNIT_PALETTES.length;
  return UNIT_PALETTES[index];
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

function formatDuration(totalMins: number): string {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`;
  }
  return `${mins} mins`;
}

function formatTimeRange(start: string, end: string): string {
  const s = start.slice(0, 5);
  const e = end.slice(0, 5);
  const totalMins = timeToMinutes(e) - timeToMinutes(s);
  return `${s} – ${e} (${formatDuration(totalMins)})`;
}

function getSessionType(entry: Entry) {
  const v = (entry.venue || "").toLowerCase();
  const c = entry.course.name.toLowerCase();
  const dur = timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime);
  if (v.includes("lab") || v.includes("workshop") || c.includes("lab") || c.includes("workshop") || c.includes("practical") || dur >= 180) {
    return { label: "Lab / Practical", icon: "🔬", style: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (v.includes("online") || v.includes("meet") || v.includes("zoom") || v.includes("teams")) {
    return { label: "Online", icon: "💻", style: "bg-sky-50 text-sky-700 border-sky-200" };
  }
  if (c.includes("tutorial") || v.includes("tutorial")) {
    return { label: "Tutorial", icon: "📝", style: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { label: "Lecture", icon: "📚", style: "bg-neutral-100 text-neutral-600 border-neutral-200" };
}

function getVenueTip(venue: string | null): string | null {
  if (!venue) return null;
  const v = venue.toLowerCase();
  if (v.includes("elb")) return "Engineering Labs Building (ELB)";
  if (v.includes("8-4-4") || v.includes("844")) return "8-4-4 Complex";
  if (v.includes("mech")) return "Mechanical Eng Workshop";
  if (v.includes("civil")) return "Civil Engineering Labs";
  if (v.includes("cad")) return "CAD Computing Lab";
  if (v.includes("science complex") || v.includes("sc")) return "Science Complex";
  if (v.includes("bishop")) return "Bishop Square Halls";
  return null;
}

// Client-side iCalendar (.ics) download for seamless Google/Apple calendar integration
function exportCalendarIcs(cohortName: string, entries: Entry[]) {
  if (entries.length === 0) return;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dayOffsets = [1, 2, 3, 4, 5, 6, 0]; // Mon=0 is 1 in JS getDay, Sun=6 is 0

  const icsLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ESA Kenyatta University//Timetable//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${cohortName} Timetable (ESA-KU)`,
  ];

  const untilDate = new Date();
  untilDate.setDate(untilDate.getDate() + 112); // ~16 weeks semester duration
  const untilStr = `${untilDate.getFullYear()}${pad(untilDate.getMonth() + 1)}${pad(untilDate.getDate())}T235959Z`;

  for (const e of entries) {
    const [startH, startM] = e.startTime.slice(0, 5).split(":").map(Number);
    const [endH, endM] = e.endTime.slice(0, 5).split(":").map(Number);

    const targetJsDay = dayOffsets[e.dayOfWeek];
    const d = new Date();
    const currentJsDay = d.getDay();
    let diff = targetJsDay - currentJsDay;
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() + diff);

    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const dayStr = pad(d.getDate());

    const dtStart = `${y}${m}${dayStr}T${pad(startH)}${pad(startM)}00`;
    const dtEnd = `${y}${m}${dayStr}T${pad(endH)}${pad(endM)}00`;

    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:esa-timetable-${e.id}-${y}@esa.ku.ac.ke`);
    icsLines.push(`DTSTAMP:${y}${m}${dayStr}T000000Z`);
    icsLines.push(`DTSTART:${dtStart}`);
    icsLines.push(`DTEND:${dtEnd}`);
    icsLines.push(`RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`);
    icsLines.push(`SUMMARY:${e.course.code} - ${e.course.name}`);
    if (e.venue) icsLines.push(`LOCATION:${e.venue}`);
    if (e.lecturerName) icsLines.push(`DESCRIPTION:Lecturer: ${e.lecturerName}`);
    icsLines.push("END:VEVENT");
  }

  icsLines.push("END:VCALENDAR");

  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cohortName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Timetable.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [browseDeptId, setBrowseDeptId] = useState<string>(String(ownDepartmentId || ""));
  const [subscribedCourseIds, setSubscribedCourseIds] = useState<Set<number>>(new Set());

  // Interactive Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");

  // UX View Modes: "agenda" (single day or all days list) vs "grid" (weekly time-table matrix)
  const [viewMode, setViewMode] = useState<"agenda" | "grid">("agenda");

  // Selected Day tab: -1 means "ALL DAYS", 0=Mon, 1=Tue, ..., 6=Sun
  // Real-world Today calculation:
  const todayIndex = useMemo(() => {
    const jsDay = new Date().getDay(); // 0=Sun, 1=Mon
    return (jsDay + 6) % 7; // 0=Mon ... 6=Sun
  }, []);

  const [activeDayTab, setActiveDayTab] = useState<number>(() => {
    // Default to today if Mon-Fri, or Monday if on weekend
    return todayIndex < 5 ? todayIndex : 0;
  });

  // Live time ticker: updates every 30 seconds
  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

    // Try preloading from localStorage for instant offline access
    const cacheKey = `esa_timetable_${cohortId}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
          setIsOfflineCached(true);
        }
      }
    } catch {
      // ignore localStorage errors
    }

    fetch(`/api/timetable?cohortId=${cohortId}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setError(d.error ?? "Couldn't load timetable.");
          return;
        }
        const data = await r.json();
        setEntries(data);
        setIsOfflineCached(false);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {
          // ignore
        }
      })
      .catch(() => {
        if (entries.length === 0) {
          setError("Network offline. Displaying cached schedule if available.");
        }
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

  // Extract all unique courses
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

  // Group by day of week & sort each day chronologically by start time
  const byDay: Record<number, Entry[]> = useMemo(() => {
    const map: Record<number, Entry[]> = {};
    for (const e of filteredEntries) {
      (map[e.dayOfWeek] ??= []).push(e);
    }
    for (const d in map) {
      map[d].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }
    return map;
  }, [filteredEntries]);

  // Live "Happening Now" & "Up Next" Status Calculation for Today
  const todayStatus = useMemo(() => {
    const todayEntries = (byDay[todayIndex] ?? []).slice();
    if (todayEntries.length === 0) {
      return { type: "none", message: "No lectures scheduled for today." };
    }

    // Check if an ongoing class exists
    const ongoing = todayEntries.find((e) => {
      const s = timeToMinutes(e.startTime);
      const en = timeToMinutes(e.endTime);
      return s <= nowMinutes && nowMinutes < en;
    });

    if (ongoing) {
      const startMin = timeToMinutes(ongoing.startTime);
      const endMin = timeToMinutes(ongoing.endTime);
      const totalDur = endMin - startMin;
      const elapsed = nowMinutes - startMin;
      const remaining = endMin - nowMinutes;
      const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDur) * 100)));

      // Find the lecture that follows this one today
      const nextAfter = todayEntries.find((e) => timeToMinutes(e.startTime) >= endMin);

      return {
        type: "ongoing",
        entry: ongoing,
        percent,
        remaining,
        nextAfter,
      };
    }

    // Check for next upcoming class today
    const upcoming = todayEntries.filter((e) => timeToMinutes(e.startTime) > nowMinutes);
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const startMin = timeToMinutes(next.startTime);
      const minsUntil = startMin - nowMinutes;
      return {
        type: "upcoming",
        entry: next,
        minsUntil,
      };
    }

    // All classes today have passed
    return {
      type: "done",
      message: "You're all done with lectures for today! 🎉",
    };
  }, [byDay, todayIndex, nowMinutes]);

  // Copy schedule summary formatted for WhatsApp class groups
  function copyDayScheduleToWhatsApp(dayNum: number) {
    const dayName = DAYS[dayNum];
    const dayEntries = byDay[dayNum] ?? [];
    if (dayEntries.length === 0) {
      setCopyFeedback("No classes to copy for this day.");
      setTimeout(() => setCopyFeedback(null), 3000);
      return;
    }

    const lines = [
      `*📅 ${dayName.toUpperCase()} TIMETABLE — ${currentCohortName.toUpperCase()}*`,
      `_School of Engineering & Architecture (ESA-KU)_`,
      "",
    ];

    for (const e of dayEntries) {
      const dur = formatTimeRange(e.startTime, e.endTime);
      const venue = e.venue ? ` | 📍 ${e.venue}` : " | 📍 Venue TBA";
      const lecturer = e.lecturerName ? ` (${e.lecturerName})` : "";
      lines.push(`• *${dur}*\n   ${e.course.code}: ${e.course.name}${venue}${lecturer}`);
    }

    lines.push("");
    lines.push("🔗 View on ESA Platform: https://esa-ku.vercel.app/timetable");

    navigator.clipboard.writeText(lines.join("\n"));
    setCopyFeedback(`Copied ${dayName}'s schedule for WhatsApp!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  }

  // Active days to display (Monday-Friday always, Saturday/Sunday only if entries exist)
  const displayDays = useMemo(() => {
    const list = [0, 1, 2, 3, 4];
    if ((byDay[5] ?? []).length > 0) list.push(5);
    if ((byDay[6] ?? []).length > 0) list.push(6);
    return list;
  }, [byDay]);

  return (
    <div className="space-y-6">
      {/* ─── 1. Live Hero Banner: "Happening Now" / "Up Next" ─────────────── */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white shadow-lg">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                {DAYS[todayIndex]} · {formatMinutes(nowMinutes)}
              </span>
              {isOfflineCached && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                  ⚡ Offline Copy
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyDayScheduleToWhatsApp(todayIndex)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer backdrop-blur-xs"
                title="Copy today's schedule formatted for WhatsApp class groups"
              >
                <span>💬 Copy for WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => exportCalendarIcs(currentCohortName, entries)}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Sync entire semester timetable into your phone's Google or Apple Calendar"
              >
                <span>📅 Export to Calendar (.ics)</span>
              </button>
            </div>
          </div>

          {copyFeedback && (
            <div className="mt-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-200">
              ✓ {copyFeedback}
            </div>
          )}

          {/* Status Content */}
          <div className="mt-4">
            {todayStatus.type === "ongoing" && todayStatus.entry && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/40">
                    🔴 Class in Session
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {todayStatus.remaining} mins remaining
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      <span className="font-mono text-accent-muted mr-2">
                        {todayStatus.entry.course.code}
                      </span>
                      {todayStatus.entry.course.name}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-neutral-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>🕒 {formatTimeRange(todayStatus.entry.startTime, todayStatus.entry.endTime)}</span>
                      {todayStatus.entry.venue && (
                        <span className="font-semibold text-emerald-300">
                          📍 {todayStatus.entry.venue}{" "}
                          {getVenueTip(todayStatus.entry.venue) && (
                            <span className="text-neutral-400 text-xs font-normal">
                              ({getVenueTip(todayStatus.entry.venue)})
                            </span>
                          )}
                        </span>
                      )}
                      {todayStatus.entry.lecturerName && (
                        <span>👤 {todayStatus.entry.lecturerName}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Live progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent transition-all duration-500"
                      style={{ width: `${todayStatus.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Started {todayStatus.entry.startTime.slice(0, 5)}</span>
                    <span>{todayStatus.percent}% elapsed</span>
                    <span>Ends {todayStatus.entry.endTime.slice(0, 5)}</span>
                  </div>
                </div>

                {todayStatus.nextAfter && (
                  <div className="mt-2 text-xs text-neutral-400 pt-1 border-t border-white/5 flex items-center gap-1.5">
                    <span className="text-accent-muted font-bold">Up next after this:</span>
                    <span className="font-mono font-semibold text-white">
                      {todayStatus.nextAfter.course.code}
                    </span>
                    <span>at {todayStatus.nextAfter.startTime.slice(0, 5)}</span>
                    {todayStatus.nextAfter.venue && <span>({todayStatus.nextAfter.venue})</span>}
                  </div>
                )}
              </div>
            )}

            {todayStatus.type === "upcoming" && todayStatus.entry && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-accent/30 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-accent-muted border border-accent/40">
                    ⏳ Up Next Today
                  </span>
                  <span className="text-xs text-neutral-300 font-semibold">
                    Starts in {formatDuration(todayStatus.minsUntil || 0)} (at {todayStatus.entry.startTime.slice(0, 5)})
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white">
                  <span className="font-mono text-accent-muted mr-2">
                    {todayStatus.entry.course.code}
                  </span>
                  {todayStatus.entry.course.name}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>🕒 {formatTimeRange(todayStatus.entry.startTime, todayStatus.entry.endTime)}</span>
                  {todayStatus.entry.venue && (
                    <span className="font-semibold text-accent-muted">
                      📍 {todayStatus.entry.venue}{" "}
                      {getVenueTip(todayStatus.entry.venue) && (
                        <span className="text-neutral-400 text-xs font-normal">
                          ({getVenueTip(todayStatus.entry.venue)})
                        </span>
                      )}
                    </span>
                  )}
                  {todayStatus.entry.lecturerName && (
                    <span>👤 {todayStatus.entry.lecturerName}</span>
                  )}
                </p>
              </div>
            )}

            {todayStatus.type === "done" && (
              <div className="py-2 text-center sm:text-left">
                <p className="text-sm sm:text-base font-bold text-white">
                  {todayStatus.message}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Great work! You can preview tomorrow's schedule by clicking the tabs below.
                </p>
              </div>
            )}

            {todayStatus.type === "none" && (
              <div className="py-2 text-center sm:text-left">
                <p className="text-sm font-semibold text-neutral-300">
                  ☕ No classes scheduled for today ({DAYS[todayIndex]}).
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Browse other days or explore past papers in the Resources section.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. Department & Academic Year Navigation ─────────────────────── */}
      <div className="card p-5 space-y-4 border-neutral-200/80 shadow-xs">
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
                        className={`rounded-lg px-2 py-2 text-center text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-accent text-white shadow-xs"
                            : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
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

        {/* ─── 3. Search & Filters Bar ────────────────────────────────────── */}
        <div className="border-t border-neutral-100 pt-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

            {/* View Mode Toggle: Day/Agenda vs Weekly Matrix */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("agenda")}
                  className={`rounded-md px-3 py-1 transition-all cursor-pointer ${
                    viewMode === "agenda"
                      ? "bg-white text-ink shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  📋 Day Agenda
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md px-3 py-1 transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-ink shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  📊 Full Matrix
                </button>
              </div>
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
                const palette = getUnitPalette(c.code);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourseFilter(isActive ? "ALL" : c.code)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent text-white shadow-xs"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
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

      {/* ─── 4. Class Rep / Admin Add Form ──────────────────────────────── */}
      {canEditCurrentCohort && (
        <AddEntryForm
          cohortId={selectedCohortId}
          departmentId={selectedDepartmentId}
          isAdmin={isAdmin}
          onAdded={() => load(selectedCohortId)}
        />
      )}

      {/* ─── 5. Day Switcher Tabs (for Agenda Mode) ─────────────────────── */}
      {viewMode === "agenda" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveDayTab(-1)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeDayTab === -1
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                All Days
              </button>

              {displayDays.map((dIdx) => {
                const isSelected = activeDayTab === dIdx;
                const isToday = dIdx === todayIndex;
                const count = (byDay[dIdx] ?? []).length;
                return (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() => setActiveDayTab(dIdx)}
                    className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-accent text-white shadow-xs"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {isToday && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? "bg-emerald-300" : "bg-emerald-500 animate-pulse"
                        }`}
                        title="Today"
                      />
                    )}
                    <span>{DAY_SHORT[dIdx]}</span>
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-[10px] ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeDayTab >= 0 && (
              <button
                type="button"
                onClick={() => copyDayScheduleToWhatsApp(activeDayTab)}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>💬 Share {DAYS[activeDayTab]} to WhatsApp</span>
              </button>
            )}
          </div>

          {/* Agenda Cards Render */}
          <div className="space-y-6">
            {(activeDayTab === -1 ? displayDays : [activeDayTab]).map((dayIdx) => {
              const dayName = DAYS[dayIdx];
              const dayEntries = byDay[dayIdx] ?? [];
              const isToday = dayIdx === todayIndex;

              return (
                <div key={dayIdx} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
                      <span>{dayName}</span>
                      {isToday && (
                        <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          TODAY
                        </span>
                      )}
                      {dayEntries.length > 0 && (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.2 text-[10px] font-bold text-neutral-700">
                          {dayEntries.length} {dayEntries.length === 1 ? "Class" : "Classes"}
                        </span>
                      )}
                    </h3>

                    {activeDayTab === -1 && dayEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => copyDayScheduleToWhatsApp(dayIdx)}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-accent cursor-pointer"
                      >
                        Copy {DAY_SHORT[dayIdx]}
                      </button>
                    )}
                  </div>

                  {dayEntries.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200 bg-white/50 p-6 text-center text-xs text-neutral-400">
                      {selectedCourseFilter !== "ALL" || searchQuery
                        ? `No lectures matching filter for ${dayName}`
                        : `No lectures scheduled on ${dayName}`}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayEntries.map((e, entryIndex) => {
                        const palette = getUnitPalette(e.course.code);
                        const sessionType = getSessionType(e);
                        const isReminded = subscribedCourseIds.has(e.course.id);
                        const venueTip = getVenueTip(e.venue);

                        // Check if there is a gap/break until the next lecture
                        const nextEntry = dayEntries[entryIndex + 1];
                        let breakMins = 0;
                        if (nextEntry) {
                          const thisEnd = timeToMinutes(e.endTime);
                          const nextStart = timeToMinutes(nextEntry.startTime);
                          breakMins = nextStart - thisEnd;
                        }

                        // Check if this class is currently ongoing right now
                        const isCurrentlyActive =
                          isToday &&
                          timeToMinutes(e.startTime) <= nowMinutes &&
                          nowMinutes < timeToMinutes(e.endTime);

                        return (
                          <div key={e.id} className="space-y-2.5">
                            <div
                              className={`card p-4 sm:p-5 transition-all bg-white border-l-4 ${palette.border} ${
                                isCurrentlyActive
                                  ? "ring-2 ring-emerald-500 shadow-md bg-emerald-50/10"
                                  : "hover:border-neutral-300 hover:shadow-card-hover"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  {/* Top Badges: Code, Type, Active Status */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-neutral-900 text-white shadow-2xs">
                                      {e.course.code}
                                    </span>

                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${sessionType.style}`}
                                    >
                                      <span>{sessionType.icon}</span>
                                      <span>{sessionType.label}</span>
                                    </span>

                                    {isCurrentlyActive && (
                                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-800 animate-pulse">
                                        ● HAPPENING NOW
                                      </span>
                                    )}
                                  </div>

                                  {/* Course Title */}
                                  <h4 className="text-base font-bold text-ink leading-snug">
                                    {e.course.name}
                                  </h4>

                                  {/* Venue & Lecturer Info */}
                                  <div className="pt-1 text-xs text-neutral-600 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                    {e.venue ? (
                                      <p className="flex items-center gap-1.5 font-medium">
                                        <span className="text-accent">📍</span>
                                        <span className="text-ink font-bold">{e.venue}</span>
                                        {venueTip && (
                                          <span className="text-neutral-400 font-normal">
                                            ({venueTip})
                                          </span>
                                        )}
                                      </p>
                                    ) : (
                                      <p className="text-neutral-400 italic">Venue TBA</p>
                                    )}

                                    {e.lecturerName && (
                                      <p className="flex items-center gap-1.5 text-neutral-600">
                                        <span className="text-neutral-400">👤</span>
                                        <span>{e.lecturerName}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Time & Duration */}
                                <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                                  <div className="text-xs font-black text-ink">
                                    🕒 {formatTimeRange(e.startTime, e.endTime)}
                                  </div>

                                  {/* Actions: Remind me & Delete */}
                                  <div className="mt-2 flex items-center gap-2">
                                    {hasActiveBadge || isAdmin ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleCourseReminder(e.course.id)}
                                        className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                                          isReminded
                                            ? "bg-accent-soft text-accent border border-accent/30 hover:bg-accent/20"
                                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                        title={
                                          isReminded
                                            ? "Push reminder active before lecture"
                                            : "Enable automated push alert for this course"
                                        }
                                      >
                                        <span>{isReminded ? "🔔 Alert Active" : "🔕 Remind Me"}</span>
                                      </button>
                                    ) : (
                                      <Link
                                        href="/profile"
                                        className="text-[10px] font-semibold text-neutral-500 hover:text-accent hover:underline flex items-center gap-1"
                                        title="Badge required for automated reminders"
                                      >
                                        <span>🔒 Badge Alert</span>
                                      </Link>
                                    )}

                                    {canEditCurrentCohort && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm(`Remove ${e.course.code} (${dayName}) from schedule?`)) {
                                            await fetch(`/api/timetable/${e.id}`, { method: "DELETE" });
                                            load(selectedCohortId);
                                          }
                                        }}
                                        className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold cursor-pointer ml-1"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Free Period Break Indicator */}
                            {breakMins >= 60 && (
                              <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-bold text-neutral-500 bg-neutral-100/70 border border-dashed border-neutral-200 rounded-lg">
                                <span>☕ {formatDuration(breakMins)} Break</span>
                                <span className="font-normal text-neutral-400">
                                  ({e.endTime.slice(0, 5)} → {nextEntry.startTime.slice(0, 5)}) · Free period for study or lunch
                                </span>
                              </div>
                            )}
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
      )}

      {/* ─── 6. Weekly Matrix / Grid View ────────────────────────────────── */}
      {viewMode === "grid" && (
        <div className="card p-4 sm:p-5 overflow-x-auto space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Weekly Overview Matrix
            </h3>
            <span className="text-[11px] text-neutral-400">
              Scroll horizontally if viewing on smaller screens
            </span>
          </div>

          <div className="min-w-[720px] grid grid-cols-5 gap-2.5">
            {displayDays.slice(0, 5).map((dIdx) => {
              const dayName = DAYS[dIdx];
              const dayEntries = byDay[dIdx] ?? [];
              const isToday = dIdx === todayIndex;

              return (
                <div
                  key={dIdx}
                  className={`rounded-xl border p-2.5 space-y-2 flex flex-col ${
                    isToday
                      ? "border-accent/40 bg-accent-soft/20"
                      : "border-neutral-200 bg-neutral-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5">
                    <span className="text-xs font-extrabold text-ink flex items-center gap-1">
                      {DAY_SHORT[dIdx]}
                      {isToday && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500">
                      {dayEntries.length} {dayEntries.length === 1 ? "class" : "classes"}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayEntries.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-[11px] text-neutral-400 italic">
                        Free Day
                      </div>
                    ) : (
                      dayEntries.map((e) => {
                        const palette = getUnitPalette(e.course.code);
                        return (
                          <div
                            key={e.id}
                            className={`rounded-lg p-2 text-xs border border-neutral-200/80 bg-white shadow-2xs space-y-1 border-l-3 ${palette.border}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-black text-ink text-[11px]">
                                {e.course.code}
                              </span>
                              <span className="text-[10px] font-bold text-neutral-500 whitespace-nowrap">
                                {e.startTime.slice(0, 5)}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-ink line-clamp-1">
                              {e.course.name}
                            </p>
                            {e.venue && (
                              <p className="text-[10px] text-accent font-medium truncate">
                                📍 {e.venue}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
            className="btn-primary w-full !text-sm cursor-pointer"
          >
            {loading ? "Adding Class..." : "Add Class to Timetable"}
          </button>
        </form>
      )}
    </div>
  );
}
