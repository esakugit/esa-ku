"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Department = { id: number; name: string; code: string };

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export default function SignUpPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [entryYear, setEntryYear] = useState<string>(String(CURRENT_YEAR));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((rows: Department[]) => {
        setDepartments(rows);
        if (rows[0]) setDepartmentId(String(rows[0].id));
        setDepartmentsLoaded(true);
      })
      .catch(() => setDepartmentsLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevVerifyUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          ...(departmentId
            ? { departmentId: Number(departmentId), entryYear: Number(entryYear) }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessage(data.message);
      setIsBootstrap(Boolean(data.isBootstrapAdmin));
      if (data.devVerifyUrl) setDevVerifyUrl(data.devVerifyUrl);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const noDepartmentsYet = departmentsLoaded && departments.length === 0;

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Image src="/brand/logo.png" alt="ESA-KU" width={64} height={37} className="mb-4" />
      <h1 className="mb-1 text-2xl font-bold text-ink">Create your account</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Every matriculated KU engineering student is an ESA member — this just verifies you're
        one.
      </p>

      {message ? (
        <div className="card p-5">
          <p className="text-sm text-ink">{message}</p>
          {isBootstrap && (
            <p className="mt-2 text-sm text-neutral-600">
              As the first account on this install, you've been made a Super Admin. Once you're
              verified and logged in, set up your department from the Admin console before other
              students sign up.
            </p>
          )}
          {devVerifyUrl && (
            <p className="mt-3 text-xs text-neutral-500">
              Dev mode (email not configured):{" "}
              <Link href={devVerifyUrl} className="text-accent underline">
                click to verify
              </Link>
            </p>
          )}
          <Link href="/login" className="btn-primary mt-4">
            Go to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <div>
            <label className="field-label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              required
              className="field-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="email">
              University email
            </label>
            <input
              id="email"
              type="email"
              required
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {noDepartmentsYet ? (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent">
              No departments are set up yet — you can add yours after signing in.
            </p>
          ) : (
            <>
              <div>
                <label className="field-label" htmlFor="department">
                  Department <span className="font-normal text-neutral-400">(optional now)</span>
                </label>
                <select
                  id="department"
                  className="field-input"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">I'll add this later</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              {departmentId && (
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
              )}
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-accent underline">
              Log in
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
