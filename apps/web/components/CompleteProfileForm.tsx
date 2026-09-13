"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDraft } from "@/lib/useDraft";

type Department = { id: number; name: string; code: string };

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

type Draft = { departmentId: string; entryYear: string; regNo: string };

export function CompleteProfileForm({
  initialDepartmentId,
  initialEntryYear,
  initialRegNo,
}: {
  initialDepartmentId: number | null;
  initialEntryYear: number | null;
  initialRegNo: string | null;
}) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm, clearDraft] = useDraft<Draft>("complete-profile", {
    departmentId: initialDepartmentId ? String(initialDepartmentId) : "",
    entryYear: initialEntryYear ? String(initialEntryYear) : String(CURRENT_YEAR),
    regNo: initialRegNo ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((rows: Department[]) => {
        setDepartments(rows);
        setForm((f) => (f.departmentId ? f : { ...f, departmentId: rows[0] ? String(rows[0].id) : "" }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEditing = Boolean(initialDepartmentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.departmentId) {
      setError("Pick a department.");
      return;
    }
    if (!form.regNo.trim()) {
      setError("Enter your registration number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: Number(form.departmentId),
          entryYear: Number(form.entryYear),
          regNo: form.regNo.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      clearDraft();
      router.push(isEditing ? "/profile" : "/");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Image src="/brand/logo.png" alt="ESA-KU" width={64} height={37} className="mb-4" />
      <h1 className="mb-1 text-2xl font-bold text-ink">
        {isEditing ? "Update your profile" : "Complete your profile"}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Your department, intake year and registration number — this is the only place we ask.
        It unlocks your class's timetable and resources.
      </p>

      {departments.length === 0 ? (
        <div className="card p-5 text-sm text-neutral-600">
          No departments exist yet. If you're an ESA admin, add one from the Admin console first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <div>
            <label className="field-label" htmlFor="department">
              Department
            </label>
            <select
              id="department"
              className="field-input"
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="entryYear">
              Entry year
            </label>
            <select
              id="entryYear"
              className="field-input"
              value={form.entryYear}
              onChange={(e) => setForm((f) => ({ ...f, entryYear: e.target.value }))}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="regNo">
              Registration number
            </label>
            <input
              id="regNo"
              required
              placeholder="e.g. ENG-123-4567/2023"
              className="field-input"
              value={form.regNo}
              onChange={(e) => setForm((f) => ({ ...f, regNo: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Saving..." : "Save and continue"}
          </button>
        </form>
      )}
    </main>
  );
}
