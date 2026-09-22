"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ fullName, email, password }),
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

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Image src="/brand/logo.png" alt="ESA-KU" width={64} height={37} className="mb-4" />
      <h1 className="mb-1 text-2xl font-bold text-ink">Create your account</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Every matriculated KU engineering student is an ESA member — this just verifies you're
        one. You'll add your department, intake year and reg. number on the next screen.
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
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-800">
              <p className="font-semibold text-amber-900 mb-1">Instant Verification Link:</p>
              <p className="mb-2">
                If the verification email does not arrive in your institutional inbox or spam folder:
              </p>
              <Link
                href={devVerifyUrl}
                className="inline-flex items-center gap-1 font-semibold text-accent underline hover:text-accent-dark"
              >
                Click here to verify your account directly →
              </Link>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="btn-primary">
              Go to login
            </Link>
          </div>
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
