"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Department = { id: number; name: string; code: string };

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export default function CompleteProfilePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [entryYear, setEntryYear] = useState(String(CURRENT_YEAR));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((rows: Department[]) => {
        setDepartments(rows);
        if (rows[0]) setDepartmentId(String(rows[0].id));
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!departmentId) {
      setError("Pick a department.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: Number(departmentId), entryYear: Number(entryYear) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/");
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
      <h1 className="mb-1 text-2xl font-bold text-ink">Complete your profile</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Pick your department and intake year so we can show your class's timetable and resources.
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
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
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
              value={entryYear}
              onChange={(e) => setEntryYear(e.target.value)}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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
