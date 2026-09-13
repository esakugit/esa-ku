"use client";

import { useEffect, useState } from "react";

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

const TABS = ["Departments", "Courses", "Clubs", "Roles"] as const;
type Tab = (typeof TABS)[number];

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("Departments");

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-neutral-100 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-ink shadow-sm" : "text-neutral-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Departments" && <DepartmentsTab />}
      {tab === "Courses" && <CoursesTab />}
      {tab === "Clubs" && <ClubsTab />}
      {tab === "Roles" && <RolesTab />}
    </div>
  );
}

function DepartmentsTab() {
  const [rows, setRows] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      body: JSON.stringify({ name, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Failed");
    setName("");
    setCode("");
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[10rem] flex-1">
          <label className="field-label">Department name</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-28">
          <label className="field-label">Code</label>
          <input className="field-input" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <button className="btn-primary" disabled={loading}>
          Add
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2">
        {rows.map((d) => (
          <li key={d.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{d.name}</p>
              <p className="text-xs text-neutral-500">{d.code}</p>
            </div>
            <button onClick={() => remove(d.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
        {rows.length === 0 && <EmptyRow text="No departments yet — add the first one above." />}
      </ul>
    </div>
  );
}

function CoursesTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [rows, setRows] = useState<Course[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      body: JSON.stringify({ departmentId: Number(departmentId), code, name }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Failed");
    setCode("");
    setName("");
    load(departmentId);
  }

  async function remove(id: number) {
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
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
          <input className="field-input" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div className="min-w-[10rem] flex-1">
          <label className="field-label">Course name</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <button className="btn-primary">Add</button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-ink">{c.code}</p>
              <p className="text-xs text-neutral-500">{c.name}</p>
            </div>
            <button onClick={() => remove(c.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
        {rows.length === 0 && <EmptyRow text="No courses in this department yet." />}
      </ul>
    </div>
  );
}

function ClubsTab() {
  const [rows, setRows] = useState<Club[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<Record<number, string>>({});

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
      body: JSON.stringify({ name, category, externalUrl, description }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Failed");
    setName("");
    setCategory("");
    setExternalUrl("");
    setDescription("");
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/clubs/${id}`, { method: "DELETE" });
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
    if (res.ok) setAdminEmail((s) => ({ ...s, [clubId]: "" }));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card space-y-3 p-4">
        <div>
          <label className="field-label">Club name</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="field-label">Category</label>
            <input className="field-input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="field-label">External link</label>
            <input
              className="field-input"
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="field-label">Description</label>
          <textarea
            className="field-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button className="btn-primary">Add club</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {c.name} {c.isPlatformOwner && <span className="badge-pill ml-1">ESA</span>}
                </p>
                <p className="text-xs text-neutral-500">{c.category || "Uncategorized"}</p>
              </div>
              {!c.isPlatformOwner && (
                <button onClick={() => remove(c.id)} className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              )}
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
        ))}
        {rows.length === 0 && <EmptyRow text="No clubs yet." />}
      </ul>
    </div>
  );
}

function RolesTab() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    { id: number; fullName: string; email: string; role: string }[]
  >([]);
  const [status, setStatus] = useState<string | null>(null);

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
    if (!res.ok) return setStatus(data.error ?? "Failed to update role.");
    setStatus("Role updated.");
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

function EmptyRow({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-400">{text}</p>;
}
