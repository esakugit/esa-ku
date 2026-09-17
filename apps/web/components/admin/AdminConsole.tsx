"use client";

import { useEffect, useState } from "react";
import { useDraft } from "@/lib/useDraft";
import { useToast } from "@/components/Toast";

type Department = { id: number; name: string; code: string };
type Course = { id: number; departmentId: number; code: string; name: string };
type Club = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  externalUrl: string | null;
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

const TABS = ["Overview", "Departments", "Courses", "Clubs", "Roles", "Roster"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Overview: "◧",
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
};

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const [counts, setCounts] = useState<OverviewCounts | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/clubs").then((r) => r.json()),
      fetch("/api/badges").then((r) => r.json()),
      fetch("/api/resources/pending").then((r) => r.json()),
      fetch("/api/legacy-members?unmatched=true").then((r) => r.json()),
    ]).then(([departments, courses, clubs, badges, resources, roster]) => {
      setCounts({
        departments: departments.length,
        courses: courses.length,
        clubs: clubs.length,
        pendingBadges: badges.length,
        pendingResources: resources.length,
        unlinkedRoster: roster.length,
      });
    });
  }, []);

  const needsAttention = [
    { label: "Pending Badge applications", value: counts?.pendingBadges, tab: "Roles" as Tab, href: "/admin/badges" },
    { label: "Uploads awaiting moderation", value: counts?.pendingResources, tab: "Roles" as Tab, href: "/admin/resources" },
    { label: "Unlinked roster entries", value: counts?.unlinkedRoster, tab: "Roster" as Tab },
  ];

  const catalog = [
    { label: "Departments", value: counts?.departments, tab: "Departments" as Tab },
    { label: "Courses", value: counts?.courses, tab: "Courses" as Tab },
    { label: "Clubs", value: counts?.clubs, tab: "Clubs" as Tab },
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Catalog</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {catalog.map((s) => (
            <StatCard key={s.label} {...s} onClick={() => onNavigate(s.tab)} />
          ))}
        </div>
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

type ClubDraft = { name: string; category: string; externalUrl: string; description: string };

function ClubsTab() {
  const [rows, setRows] = useState<Club[]>([]);
  const [form, setForm, clearDraft] = useDraft<ClubDraft>("admin-club-create", {
    name: "",
    category: "",
    externalUrl: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ClubDraft>({ name: "", category: "", externalUrl: "", description: "" });
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
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.name} {c.isPlatformOwner && <span className="badge-pill ml-1">ESA</span>}
                  </p>
                  <p className="text-xs text-neutral-500">{c.category || "Uncategorized"}</p>
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

function RolesTab() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    { id: number; fullName: string; email: string; role: string }[]
  >([]);
  const [status, setStatus] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  async function search(query: string) {
    setQ(query);
    if (query.trim().length < 2) return setResults([]);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    setResults(await res.json());
  }

  async function setRole(userId: number, role: string) {
    setStatus(null);
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error ?? "Failed to update role.");
      toastError("Couldn't update role", data.error);
      return;
    }
    setStatus("Role updated.");
    success("Role updated");
    search(q);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Find a student by email</label>
        <input className="field-input" value={q} onChange={(e) => search(e.target.value)} placeholder="name@students.ku.ac.ke" />
      </div>
      {status && <p className="text-sm text-accent">{status}</p>}
      <ul className="space-y-2">
        {results.map((u) => (
          <li key={u.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{u.fullName}</p>
              <p className="text-xs text-neutral-500">
                {u.email} · current role: <span className="font-medium">{u.role}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {["student", "class_rep", "club_admin", "esa_admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(u.id, r)}
                  disabled={u.role === r}
                  className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                >
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-neutral-400">
        Elevated roles only take effect once that person holds an active Badge.
      </p>
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
  const [showMatched, setShowMatched] = useState(false);
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
    if (!res.ok) return setError(data.error ?? "Failed");
    clearDraft();
    success("Added to roster", `${data.fullName} · ${data.badgeNumber}`);
    load();
  }

  async function remove(id: number) {
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
      setMatchStatus((m) => ({ ...m, [id]: data.error ?? "Failed to link." }));
      toastError("Couldn't link", data.error);
      return;
    }
    success("Linked", "Badge is now active.");
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
    success("Card image saved", "It will show on their profile once linked.");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, cardImageUrl: data.cardImageUrl } : r)));
  }

  const visible = rows.filter((r) => showMatched || !r.matchedUserId);

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[10rem] flex-1">
          <label className="field-label">Member name (from the card)</label>
          <input
            className="field-input"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
        </div>
        <div className="w-32">
          <label className="field-label">Badge no.</label>
          <input
            className="field-input"
            placeholder="ESA-1330"
            value={form.badgeNumber}
            onChange={(e) => setForm((f) => ({ ...f, badgeNumber: e.target.value }))}
          />
        </div>
        <div className="w-40">
          <label className="field-label">Reg. no. (if known)</label>
          <input
            className="field-input"
            value={form.regNo}
            onChange={(e) => setForm((f) => ({ ...f, regNo: e.target.value }))}
          />
        </div>
        <button className="btn-primary" disabled={loading}>
          Add to roster
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
        <p className="w-full text-xs text-neutral-400">
          Leave the badge number blank to have one generated automatically.
        </p>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {visible.length} {showMatched ? "" : "unlinked "}on roster
        </p>
        <button onClick={() => setShowMatched((v) => !v)} className="text-xs text-accent hover:underline">
          {showMatched ? "Hide linked" : "Show linked too"}
        </button>
      </div>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {visible.map((r) => (
          <li key={r.id} className="card-interactive space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                {r.cardImageUrl ? (
                  <img
                    src={r.cardImageUrl}
                    alt=""
                    className="h-12 w-12 flex-none rounded-md object-cover ring-1 ring-neutral-200"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-neutral-100 text-[10px] text-neutral-400 ring-1 ring-neutral-200">
                    No card
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-ink">{r.fullName}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {r.badgeNumber}
                    {r.regNo ? ` · ${r.regNo}` : ""}
                  </p>
                  <label className="mt-1 inline-block cursor-pointer text-xs text-accent hover:underline">
                    {uploadingId === r.id ? "Uploading…" : r.cardImageUrl ? "Replace card image" : "Upload card image"}
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
                <span className={r.matchedUserId ? "status-pill-linked" : "status-pill-unlinked"}>
                  {r.matchedUserId ? "Linked" : "Unlinked"}
                </span>
                {!r.matchedUserId && (
                  <button onClick={() => remove(r.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>

            {r.matchedUserId ? (
              <p className="text-xs text-neutral-500">
                {r.matchedUser?.fullName} ({r.matchedUser?.email})
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  className="field-input flex-1 py-1.5 text-xs"
                  placeholder="Their email or reg. no."
                  value={matchInputs[r.id] ?? ""}
                  onChange={(e) => setMatchInputs((m) => ({ ...m, [r.id]: e.target.value }))}
                />
                <button onClick={() => match(r.id)} className="btn-secondary px-3 py-1.5 text-xs">
                  Link
                </button>
              </div>
            )}
            {matchStatus[r.id] && <p className="text-xs text-red-600">{matchStatus[r.id]}</p>}
          </li>
        ))}
        {visible.length === 0 && <EmptyRow text="No roster entries yet — add the first membership card above." />}
      </ul>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-400">{text}</p>;
}
