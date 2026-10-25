"use client";

import { useEffect, useState, useMemo } from "react";
import { useDraft } from "@/lib/useDraft";
import { useToast } from "@/components/Toast";
import { SiteHeroTab } from "./SiteHeroTab";
import { AnnouncementsTab } from "./AnnouncementsTab";
import { EventsTab } from "./EventsTab";
import { MembersTab } from "./MembersTab";
import { SmtpDiagnosticCard } from "./SmtpDiagnosticCard";

type Department = { id: number; name: string; code: string };
type Course = { id: number; departmentId: number; code: string; name: string };
type Club = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  externalUrl: string | null;
  logoBlobUrl: string | null;
  isPlatformOwner: boolean;
};

type LegacyMember = {
  id: number;
  fullName: string;
  badgeNumber: string;
  regNo: string | null;
  notes: string | null;
  cardImageUrl: string | null;
  matchedUserId: number | null;
  matchedUser: { id: number; fullName: string; email: string } | null;
};

const TABS = [
  "Overview",
  "Members",
  "Site & Hero",
  "Announcements",
  "Events",
  "Departments",
  "Courses",
  "Clubs",
  "Roles",
  "Roster",
] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Overview: "◧",
  Members: "👥",
  "Site & Hero": "🎨",
  Announcements: "📢",
  Events: "📅",
  Departments: "🏛",
  Courses: "📘",
  Clubs: "🧩",
  Roles: "🛡",
  Roster: "🗂",
};

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-neutral-100 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-ink shadow-sm" : "text-neutral-500 hover:text-ink"
            }`}
          >
            <span aria-hidden="true">{TAB_ICONS[t]}</span>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab onNavigate={setTab} />}
      {tab === "Members" && <MembersTab />}
      {tab === "Site & Hero" && <SiteHeroTab />}
      {tab === "Announcements" && <AnnouncementsTab />}
      {tab === "Events" && <EventsTab />}
      {tab === "Departments" && <DepartmentsTab />}
      {tab === "Courses" && <CoursesTab />}
      {tab === "Clubs" && <ClubsTab />}
      {tab === "Roles" && <RolesTab />}
      {tab === "Roster" && <RosterTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview — a real, API-backed snapshot (not mock data): pending queues that
// need attention, plus running totals for the catalog you manage below.
// ---------------------------------------------------------------------------

type OverviewCounts = {
  departments: number;
  courses: number;
  clubs: number;
  pendingBadges: number;
  pendingResources: number;
  unlinkedRoster: number;
  totalMembers: number;
  leadershipCount: number;
};

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const [counts, setCounts] = useState<OverviewCounts | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()).catch(() => []),
      fetch("/api/courses").then((r) => r.json()).catch(() => []),
      fetch("/api/clubs").then((r) => r.json()).catch(() => []),
      fetch("/api/badges").then((r) => r.json()).catch(() => []),
      fetch("/api/resources/pending").then((r) => r.json()).catch(() => []),
      fetch("/api/legacy-members?unmatched=true").then((r) => r.json()).catch(() => []),
      fetch("/api/users").then((r) => r.json()).catch(() => ({ users: [], stats: {} })),
    ]).then(([departments, courses, clubs, badges, resources, roster, usersData]) => {
      const allUsers = Array.isArray(usersData?.users) ? usersData.users : [];
      const leaders = allUsers.filter((u: any) => u.role && u.role !== "student").length;
      setCounts({
        departments: departments.length || 0,
        courses: courses.length || 0,
        clubs: clubs.length || 0,
        pendingBadges: badges.length || 0,
        pendingResources: resources.length || 0,
        unlinkedRoster: roster.length || 0,
        totalMembers: allUsers.length || 0,
        leadershipCount: leaders,
      });
    });
  }, []);

  const needsAttention = [
    { label: "Pending Badge applications", value: counts?.pendingBadges, href: "/admin/badges" },
    { label: "Uploads awaiting moderation", value: counts?.pendingResources, href: "/admin/resources" },
    { label: "Unlinked roster entries", value: counts?.unlinkedRoster, tab: "Roster" as Tab, onClick: () => onNavigate("Roster") },
  ];

  const catalog = [
    { label: "Registered Platform Users", value: counts?.totalMembers, tab: "Members" as Tab, onClick: () => onNavigate("Members") },
    { label: "Leadership & Rep Roles", value: counts?.leadershipCount, tab: "Roles" as Tab, onClick: () => onNavigate("Roles") },
    { label: "Departments", value: counts?.departments, tab: "Departments" as Tab, onClick: () => onNavigate("Departments") },
    { label: "Courses", value: counts?.courses, tab: "Courses" as Tab, onClick: () => onNavigate("Courses") },
    { label: "Clubs & Chapters", value: counts?.clubs, tab: "Clubs" as Tab, onClick: () => onNavigate("Clubs") },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Needs attention</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {needsAttention.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Platform Catalog & Community</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {catalog.map((s) => (
            <StatCard key={s.label} {...s} onClick={s.onClick} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">System Diagnostics</p>
        <SmtpDiagnosticCard />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  onClick,
}: {
  label: string;
  value: number | undefined;
  tab?: Tab;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <p className="text-2xl font-bold text-ink">{value ?? "–"}</p>
      <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
    </>
  );
  const className = "stat-card block text-left transition-shadow hover:shadow-card-hover";
  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

type DeptDraft = { name: string; code: string };

function DepartmentsTab() {
  const [rows, setRows] = useState<Department[]>([]);
  const [form, setForm, clearDraft] = useDraft<DeptDraft>("admin-department-create", { name: "", code: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DeptDraft>({ name: "", code: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const { success, info } = useToast();

  const load = () => fetch("/api/departments").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Failed");
    clearDraft();
    success("Department added", data.name);
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    info("Department removed");
    load();
  }

  function startEdit(d: Department) {
    setEditingId(d.id);
    setEditForm({ name: d.name, code: d.code });
    setEditError(null);
  }

  async function saveEdit(id: number) {
    setEditError(null);
    const res = await fetch(`/api/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setEditError(data.error ?? "Failed to save.");
    setEditingId(null);
    success("Department updated");
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[10rem] flex-1">
          <label className="field-label">Department name</label>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="w-28">
          <label className="field-label">Code</label>
          <input
            className="field-input"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            required
          />
        </div>
        <button className="btn-primary" disabled={loading}>
          Add
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((d) =>
          editingId === d.id ? (
            <li key={d.id} className="card space-y-2 p-4">
              <input
                className="field-input"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="field-input"
                value={editForm.code}
                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
              />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <button onClick={() => saveEdit(d.id)} className="btn-primary flex-1 py-1.5 text-xs">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-1.5 text-xs">
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li key={d.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{d.name}</p>
                <p className="text-xs text-neutral-500">{d.code}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(d)} className="text-sm text-accent hover:underline">
                  Edit
                </button>
                <button onClick={() => remove(d.id)} className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </li>
          ),
        )}
        {rows.length === 0 && <EmptyRow text="No departments yet — add the first one above." />}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

type CourseDraft = { code: string; name: string };

function CoursesTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [rows, setRows] = useState<Course[]>([]);
  const [form, setForm, clearDraft] = useDraft<CourseDraft>("admin-course-create", { code: "", name: "" });
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CourseDraft>({ code: "", name: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const { success, info } = useToast();

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then((d: Department[]) => {
      setDepartments(d);
      if (d[0]) setDepartmentId(String(d[0].id));
    });
  }, []);

  const load = (deptId: string) =>
    deptId &&
    fetch(`/api/courses?departmentId=${deptId}`)
      .then((r) => r.json())
      .then(setRows);

  useEffect(() => {
    load(departmentId);
  }, [departmentId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: Number(departmentId), ...form }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Failed");
    clearDraft();
    success("Course added", data.code);
    load(departmentId);
  }

  async function remove(id: number) {
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    info("Course removed");
    load(departmentId);
  }

  function startEdit(c: Course) {
    setEditingId(c.id);
    setEditForm({ code: c.code, name: c.name });
    setEditError(null);
  }

  async function saveEdit(id: number) {
    setEditError(null);
    const res = await fetch(`/api/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setEditError(data.error ?? "Failed to save.");
    setEditingId(null);
    success("Course updated");
    load(departmentId);
  }

  if (departments.length === 0) {
    return <EmptyRow text="Add a department first." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Department</label>
        <select className="field-input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-32">
          <label className="field-label">Course code</label>
          <input
            className="field-input"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            required
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label className="field-label">Course name</label>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <button className="btn-primary">Add</button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {rows.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="card space-y-2 p-4">
              <input
                className="field-input"
                value={editForm.code}
                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
              />
              <input
                className="field-input"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <button onClick={() => saveEdit(c.id)} className="btn-primary flex-1 py-1.5 text-xs">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-1.5 text-xs">
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li key={c.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{c.code}</p>
                <p className="text-xs text-neutral-500">{c.name}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(c)} className="text-sm text-accent hover:underline">
                  Edit
                </button>
                <button onClick={() => remove(c.id)} className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </li>
          ),
        )}
        {rows.length === 0 && <EmptyRow text="No courses in this department yet." />}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------------

type ClubDraft = {
  name: string;
  category: string;
  externalUrl: string;
  logoBlobUrl: string;
  description: string;
};

function ClubsTab() {
  const [rows, setRows] = useState<Club[]>([]);
  const [form, setForm, clearDraft] = useDraft<ClubDraft>("admin-club-create", {
    name: "",
    category: "",
    externalUrl: "",
    logoBlobUrl: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClubDraft>({
    name: "",
    category: "",
    externalUrl: "",
    logoBlobUrl: "",
    description: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const { success, error: toastError, info } = useToast();

  const load = () => fetch("/api/clubs").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Failed");
    clearDraft();
    success("Club added", data.name);
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/clubs/${id}`, { method: "DELETE" });
    info("Club removed");
    load();
  }

  async function addAdmin(clubId: number) {
    const email = adminEmail[clubId];
    if (!email) return;
    const res = await fetch(`/api/clubs/${clubId}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, level: "editor" }),
    });
    if (res.ok) {
      setAdminEmail((s) => ({ ...s, [clubId]: "" }));
      success("Committee member added");
    } else {
      toastError("Couldn't add that admin", "Check the email and try again.");
    }
  }

  function startEdit(c: Club) {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      category: c.category ?? "",
      externalUrl: c.externalUrl ?? "",
      logoBlobUrl: c.logoBlobUrl ?? "",
      description: c.description ?? "",
    });
    setEditError(null);
  }

  async function saveEdit(id: number) {
    setEditError(null);
    const res = await fetch(`/api/clubs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setEditError(data.error ?? "Failed to save.");
    setEditingId(null);
    success("Club updated");
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card space-y-3 p-4">
        <div>
          <label className="field-label">Club name</label>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="field-label">Category</label>
            <input
              className="field-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <label className="field-label">External link</label>
            <input
              className="field-input"
              placeholder="https://..."
              value={form.externalUrl}
              onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="field-label">Logo Image URL</label>
          <input
            className="field-input"
            placeholder="/brand/logo.png or https://..."
            value={form.logoBlobUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoBlobUrl: e.target.value }))}
          />
        </div>
        <div>
          <label className="field-label">Description</label>
          <textarea
            className="field-input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <button className="btn-primary">Add club</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {rows.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="card space-y-2 p-4">
              <input
                className="field-input"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              <div className="flex gap-2">
                <input
                  className="field-input flex-1"
                  placeholder="Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                />
                <input
                  className="field-input flex-1"
                  placeholder="https://..."
                  value={editForm.externalUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, externalUrl: e.target.value }))}
                />
              </div>
              <div>
                <input
                  className="field-input"
                  placeholder="Logo URL (/brand/logo.png or https://...)"
                  value={editForm.logoBlobUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, logoBlobUrl: e.target.value }))}
                />
              </div>
              <textarea
                className="field-input"
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <button onClick={() => saveEdit(c.id)} className="btn-primary flex-1 py-1.5 text-xs">
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-1.5 text-xs">
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {c.logoBlobUrl ? (
                    <img
                      src={c.logoBlobUrl}
                      alt={c.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-contain bg-neutral-50 p-1 border border-neutral-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {c.name} {c.isPlatformOwner && <span className="badge-pill ml-1">ESA</span>}
                    </p>
                    <p className="text-xs text-neutral-500">{c.category || "Uncategorized"}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(c)} className="text-sm text-accent hover:underline">
                    Edit
                  </button>
                  {!c.isPlatformOwner && (
                    <button onClick={() => remove(c.id)} className="text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="field-input flex-1"
                  placeholder="Add committee member by email"
                  value={adminEmail[c.id] ?? ""}
                  onChange={(e) => setAdminEmail((s) => ({ ...s, [c.id]: e.target.value }))}
                />
                <button onClick={() => addAdmin(c.id)} className="btn-secondary whitespace-nowrap">
                  Add admin
                </button>
              </div>
            </li>
          ),
        )}
        {rows.length === 0 && <EmptyRow text="No clubs yet." />}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

type RoleUser = {
  id: number;
  fullName: string;
  email: string;
  regNo: string | null;
  role: string;
  department: { id: number; name: string; code: string } | null;
  cohort: { id: number; label: string; entryYear: number } | null;
  badge: {
    badgeNumber: string | null;
    status: string;
  } | null;
};

function RolesTab() {
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [cohorts, setCohorts] = useState<{ id: number; label: string }[]>([]);
  const [clubs, setClubs] = useState<{ id: number; name: string }[]>([]);
  
  // Role assignment modal
  const [selectedUser, setSelectedUser] = useState<RoleUser | null>(null);
  const [targetRole, setTargetRole] = useState<string>("student");
  const [targetCohortId, setTargetCohortId] = useState<number | undefined>(undefined);
  const [targetClubId, setTargetClubId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const { success, error: toastError } = useToast();

  function loadData() {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.users)) {
          setUsers(data.users);
        }
      })
      .catch((err) => toastError("Could not load users", err.message))
      .finally(() => setLoading(false));

    fetch("/api/cohorts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCohorts(data);
          if (data.length > 0) setTargetCohortId(data[0].id);
        }
      })
      .catch(() => {});

    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClubs(data);
          if (data.length > 0) setTargetClubId(data[0].id);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, []);

  // Compute breakdown counts
  const counts = useMemo(() => {
    let superAdmin = 0;
    let esaAdmin = 0;
    let classRep = 0;
    let clubAdmin = 0;
    let student = 0;

    for (const u of users) {
      if (u.role === "super_admin") superAdmin++;
      else if (u.role === "esa_admin") esaAdmin++;
      else if (u.role === "class_rep") classRep++;
      else if (u.role === "club_admin") clubAdmin++;
      else student++;
    }

    return {
      superAdmin,
      esaAdmin,
      classRep,
      clubAdmin,
      student,
      totalLeadership: superAdmin + esaAdmin + classRep + clubAdmin,
      total: users.length,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter === "leadership") {
        if (u.role === "student") return false;
      } else if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }

      // Search query filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchReg = u.regNo?.toLowerCase().includes(q) ?? false;
        const matchDept = u.department?.name.toLowerCase().includes(q) ?? false;
        const matchCohort = u.cohort?.label.toLowerCase().includes(q) ?? false;
        return matchName || matchEmail || matchReg || matchDept || matchCohort;
      }

      return true;
    });
  }, [users, roleFilter, search]);

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          role: targetRole,
          cohortId: targetRole === "class_rep" ? targetCohortId : undefined,
          clubId: targetRole === "club_admin" ? targetClubId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      success("Role updated", `${selectedUser.fullName} is now ${targetRole.replace("_", " ")}.`);
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      toastError("Role update failed", err.message);
    } finally {
      setSaving(false);
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "super_admin":
        return <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-bold border border-purple-200">👑 Super Admin</span>;
      case "esa_admin":
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-bold border border-blue-200">🛡️ ESA Admin</span>;
      case "class_rep":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-bold border border-emerald-200">🎓 Class Rep</span>;
      case "club_admin":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold border border-amber-200">🧩 Club Admin</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 text-neutral-600 px-2 py-0.5 text-xs font-medium border border-neutral-200">Student</span>;
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Leadership Roles Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Super Admins</p>
          <p className="mt-1 text-2xl font-black text-purple-900">{counts.superAdmin}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">ESA ExCom Admins</p>
          <p className="mt-1 text-2xl font-black text-blue-900">{counts.esaAdmin}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Class Reps</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{counts.classRep}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Club Leaders</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{counts.clubAdmin}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Total Users</p>
          <p className="mt-1 text-2xl font-black text-neutral-800">{counts.total}</p>
        </div>
      </div>

      {/* 2. Search & Role Filter Tabs */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none text-xs">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email, reg no, department..."
              className="field-input w-full pl-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-semibold text-accent hover:underline cursor-pointer disabled:opacity-50"
          >
            ↻ Refresh Directory
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">Filter:</span>
          {[
            { id: "all", label: `All Users (${counts.total})` },
            { id: "leadership", label: `👑 Leadership (${counts.totalLeadership})` },
            { id: "esa_admin", label: `ESA Admins (${counts.esaAdmin})` },
            { id: "class_rep", label: `Class Reps (${counts.classRep})` },
            { id: "club_admin", label: `Club Admins (${counts.clubAdmin})` },
            { id: "student", label: `Students (${counts.student})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRoleFilter(f.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === f.id
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Platform Users & Roles Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 sm:px-6 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Platform Users & Roles Directory ({filteredUsers.length})
          </h3>
          <span className="text-[11px] text-neutral-500">
            Elevated privileges activate only when user holds an active badge
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Loading platform users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No users match the search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Member / User</th>
                  <th className="px-4 py-3">Academic Department & Cohort</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Badge Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent text-xs">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink text-xs sm:text-sm">{u.fullName}</p>
                          <p className="truncate text-xs text-neutral-500">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-ink">
                        {u.department ? `${u.department.name} (${u.department.code})` : <span className="text-neutral-400 italic">No department set</span>}
                      </p>
                      {u.cohort && (
                        <p className="text-[11px] text-neutral-500">Cohort: {u.cohort.label}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="px-4 py-3">
                      {u.badge?.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          ✓ {u.badge.badgeNumber || "Active Badge"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">
                          No active badge
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {u.role === "super_admin" ? (
                        <span className="text-xs text-neutral-400 font-semibold italic">Protected</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setTargetRole(u.role);
                            if (u.cohort?.id) setTargetCohortId(u.cohort.id);
                          }}
                          className="rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs cursor-pointer transition-colors"
                        >
                          Change Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Edit Role Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="card w-full max-w-md p-6 bg-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Assign Role</h3>
                <p className="text-xs text-neutral-500">{selectedUser.fullName} ({selectedUser.email})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-neutral-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="field-label">Select Platform Role</label>
                <select
                  className="field-input font-semibold"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="student">Student (Standard Access)</option>
                  <option value="class_rep">Class Representative (Cohort Timetable Management)</option>
                  <option value="club_admin">Club Admin (Technical Chapter Management)</option>
                  <option value="esa_admin">ESA Admin (Executive Committee)</option>
                </select>
              </div>

              {targetRole === "class_rep" && (
                <div>
                  <label className="field-label">Cohort to Represent</label>
                  <select
                    className="field-input font-semibold"
                    value={targetCohortId}
                    onChange={(e) => setTargetCohortId(Number(e.target.value))}
                    required
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Class Reps can edit and publish timetables for their assigned cohort.
                  </p>
                </div>
              )}

              {targetRole === "club_admin" && (
                <div>
                  <label className="field-label">Technical Chapter / Club</label>
                  <select
                    className="field-input font-semibold"
                    value={targetClubId}
                    onChange={(e) => setTargetClubId(Number(e.target.value))}
                    required
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Club Admins can post announcements and manage events for their chapter.
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-600 space-y-1">
                <p className="font-semibold text-neutral-700">Governance Note:</p>
                <p>
                  Elevated capabilities (posting, timetable editing, admin console) require an active ESA Membership Badge. If the student's badge lapses, the role remains inert until renewal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="btn-secondary !text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary !text-xs cursor-pointer"
                >
                  {saving ? "Saving Role..." : "Confirm Role Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roster — members who already hold a Badge from before the platform existed
// (physical/Canva membership cards). Record them here as cards come in; link
// each row to the member's real account once they sign up.
// ---------------------------------------------------------------------------

type RosterDraft = { fullName: string; badgeNumber: string; regNo: string; notes: string };

function RosterTab() {
  const [rows, setRows] = useState<LegacyMember[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "unlinked" | "linked">("unlinked");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [form, setForm, clearDraft] = useDraft<RosterDraft>("admin-roster-create", {
    fullName: "",
    badgeNumber: "",
    regNo: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchInputs, setMatchInputs] = useState<Record<number, string>>({});
  const [matchStatus, setMatchStatus] = useState<Record<number, string>>({});
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const { success, error: toastError, info } = useToast();

  const load = () => fetch("/api/legacy-members").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/legacy-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        badgeNumber: form.badgeNumber || undefined,
        regNo: form.regNo || undefined,
        notes: form.notes || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Failed to add member");
    clearDraft();
    success("Added to roster", `${data.fullName} · ${data.badgeNumber}`);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Are you sure you want to remove this roster entry?")) return;
    await fetch(`/api/legacy-members/${id}`, { method: "DELETE" });
    info("Roster entry removed");
    load();
  }

  async function match(id: number) {
    const identifier = (matchInputs[id] ?? "").trim();
    setMatchStatus((m) => ({ ...m, [id]: "" }));
    if (!identifier) return;
    const res = await fetch(`/api/legacy-members/${id}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMatchStatus((m) => ({ ...m, [id]: data.error ?? "Failed to link account." }));
      toastError("Couldn't link account", data.error);
      return;
    }
    success("Account Linked", "Member's badge has been activated with their legacy badge number.");
    load();
  }

  async function uploadCard(id: number, file: File) {
    setUploadingId(id);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/legacy-members/${id}/card`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploadingId(null);
    if (!res.ok) {
      toastError("Upload failed", data.error ?? "Please try again.");
      return;
    }
    success("Card image saved", "Historical card scan will display on their profile once linked.");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, cardImageUrl: data.cardImageUrl } : r)));
  }

  // Calculate roster metrics
  const totalCount = rows.length;
  const linkedCount = rows.filter((r) => !!r.matchedUserId).length;
  const unlinkedCount = rows.filter((r) => !r.matchedUserId).length;
  const withCardsCount = rows.filter((r) => !!r.cardImageUrl).length;

  // Filter and search
  const filtered = rows.filter((r) => {
    if (filterMode === "unlinked" && r.matchedUserId) return false;
    if (filterMode === "linked" && !r.matchedUserId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.fullName.toLowerCase().includes(q);
      const matchBadge = r.badgeNumber.toLowerCase().includes(q);
      const matchReg = r.regNo?.toLowerCase().includes(q) ?? false;
      const matchUser = r.matchedUser?.fullName?.toLowerCase().includes(q) || r.matchedUser?.email?.toLowerCase().includes(q);
      return matchName || matchBadge || matchReg || matchUser;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Explanatory Workflow Guide */}
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 via-neutral-50 to-white p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white font-bold text-lg shadow-xs">
              🗂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  Legacy Membership Roster &amp; Card Linking
                </h3>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                  Pre-Platform Members
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-600 leading-relaxed max-w-2xl">
                Before this platform was built, ESA issued physical and Canva membership cards. This roster tracks paid members so they <strong>do not have to pay again</strong>. When they register on the site, link their account here to instantly activate their digital badge.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="text-xs text-accent hover:underline font-semibold shrink-0 cursor-pointer"
          >
            {showGuide ? "Hide Guide ▲" : "Show How It Works ▼"}
          </button>
        </div>

        {showGuide && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-accent/10 pt-4 text-xs">
            <div className="rounded-xl bg-white p-3 border border-neutral-200/80 space-y-1">
              <span className="font-bold text-accent">Step 1: Record Card</span>
              <p className="text-neutral-600 text-[11px] leading-snug">
                Enter member name and old badge number (e.g. <code>ESA-1042</code>). Optionally upload a photo/scan of their physical card.
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-neutral-200/80 space-y-1">
              <span className="font-bold text-accent">Step 2: Student Signs Up</span>
              <p className="text-neutral-600 text-[11px] leading-snug">
                Student registers their account on this website using their KU email or student credentials.
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 border border-neutral-200/80 space-y-1">
              <span className="font-bold text-accent">Step 3: Link &amp; Activate</span>
              <p className="text-neutral-600 text-[11px] leading-snug">
                Type their email or registration number into the Link box. Their badge is activated immediately with no fee required!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total On Roster</p>
          <p className="mt-1 text-2xl font-black text-ink">{totalCount}</p>
          <p className="text-[11px] text-neutral-500">Historical members recorded</p>
        </div>
        <div className="card p-3 text-center sm:text-left border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Unlinked (Pending)</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{unlinkedCount}</p>
          <p className="text-[11px] text-neutral-500">Waiting for student account</p>
        </div>
        <div className="card p-3 text-center sm:text-left border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Linked &amp; Active</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{linkedCount}</p>
          <p className="text-[11px] text-neutral-500">Connected to active accounts</p>
        </div>
        <div className="card p-3 text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Card Scans Attached</p>
          <p className="mt-1 text-2xl font-black text-ink">{withCardsCount}</p>
          <p className="text-[11px] text-neutral-500">Physical card images saved</p>
        </div>
      </div>

      {/* 3. Add New Roster Member Form */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
            <span>➕</span>
            <span>Record A Physical / Canva Membership Card</span>
          </h4>
          <span className="text-[11px] text-neutral-400">Fields marked * are required</span>
        </div>

        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Member Full Name *</label>
              <input
                className="field-input"
                placeholder="e.g. Brian Otieno"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="field-label">Badge Number (Optional)</label>
              <input
                className="field-input"
                placeholder="e.g. ESA-1042"
                value={form.badgeNumber}
                onChange={(e) => setForm((f) => ({ ...f, badgeNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">Reg. Number (if known)</label>
              <input
                className="field-input"
                placeholder="e.g. J17/1234/2023"
                value={form.regNo}
                onChange={(e) => setForm((f) => ({ ...f, regNo: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex-1 min-w-[14rem]">
              <input
                className="field-input text-xs !py-1.5"
                placeholder="Internal notes (e.g. Paid in 2023 cash register, physical card filed in dept office)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <button className="btn-primary !text-xs !py-1.5 px-4 cursor-pointer" disabled={loading}>
              {loading ? "Adding..." : "+ Add to Roster"}
            </button>
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
          <p className="text-[11px] text-neutral-400">
            Tip: Leave the badge number blank to automatically assign the next sequential badge number.
          </p>
        </form>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMode("unlinked")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === "unlinked"
                ? "bg-white text-ink shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Unlinked ({unlinkedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("linked")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === "linked"
                ? "bg-white text-ink shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Linked &amp; Active ({linkedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-white text-ink shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            All Entries ({totalCount})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <input
            className="field-input !py-1.5 text-xs"
            placeholder="🔍 Search name, badge, or reg no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 5. Roster Entries Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Showing {filtered.length} of {rows.length} members</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-accent hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>

        <ul className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {filtered.map((r) => (
            <li key={r.id} className="card p-4 space-y-3 hover:border-neutral-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  {/* Card scan thumbnail */}
                  <div className="relative group/thumb">
                    {r.cardImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={r.cardImageUrl}
                        alt="Card"
                        className="h-14 w-14 flex-none rounded-lg object-cover ring-1 ring-neutral-200 shadow-2xs"
                      />
                    ) : (
                      <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-lg bg-neutral-100 text-[9px] text-neutral-400 ring-1 ring-neutral-200">
                        <span>💳</span>
                        <span>No Card</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{r.fullName}</p>
                    </div>

                    <p className="mt-0.5 text-xs font-mono font-semibold text-accent">
                      {r.badgeNumber}
                      {r.regNo && <span className="font-sans font-normal text-neutral-500"> · {r.regNo}</span>}
                    </p>

                    {r.notes && (
                      <p className="mt-1 text-[11px] text-neutral-500 italic">
                        "{r.notes}"
                      </p>
                    )}

                    <label className="mt-1.5 inline-flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-accent hover:underline">
                      <span>📸</span>
                      <span>
                        {uploadingId === r.id ? "Uploading…" : r.cardImageUrl ? "Replace card scan" : "Upload card scan"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId === r.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) uploadCard(r.id, file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      r.matchedUserId
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${r.matchedUserId ? "bg-emerald-600" : "bg-amber-600"}`} />
                    {r.matchedUserId ? "Linked & Active" : "Unlinked"}
                  </span>

                  {!r.matchedUserId && (
                    <button
                      onClick={() => remove(r.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer p-1"
                      title="Remove from roster"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Linking Status / Action Box */}
              <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-200/80">
                {r.matchedUserId ? (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓ Connected:</span>
                      <span className="font-semibold text-ink">{r.matchedUser?.fullName}</span>
                      <span className="text-neutral-500 text-[11px]">({r.matchedUser?.email})</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Digital Badge Active
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-neutral-600">
                      Link to student account once they register on the site:
                    </p>
                    <div className="flex gap-2">
                      <input
                        className="field-input flex-1 !py-1 text-xs"
                        placeholder="Student's email or reg. number..."
                        value={matchInputs[r.id] ?? ""}
                        onChange={(e) => setMatchInputs((m) => ({ ...m, [r.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => match(r.id)}
                        className="btn-primary !py-1 px-3 text-xs font-semibold cursor-pointer shrink-0"
                      >
                        Link Account
                      </button>
                    </div>
                    {matchStatus[r.id] && (
                      <p className="text-xs text-red-600 font-semibold mt-1">{matchStatus[r.id]}</p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <EmptyRow
            text={
              searchQuery
                ? `No roster members matching "${searchQuery}".`
                : filterMode === "linked"
                ? "No linked roster entries yet."
                : "No roster entries yet — add the first membership card using the form above."
            }
          />
        )}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-400">{text}</p>;
}
