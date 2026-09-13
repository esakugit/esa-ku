"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const VERIFY_MESSAGES: Record<string, { text: string; tone: "good" | "bad" }> = {
  success: { text: "Email verified — you can log in now.", tone: "good" },
  expired: { text: "That verification link is invalid or has expired.", tone: "bad" },
  missing: { text: "Missing verification token.", tone: "bad" },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyStatus = searchParams.get("verify");
  const verifyNotice = verifyStatus ? VERIFY_MESSAGES[verifyStatus] : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/profile");
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
      <h1 className="mb-6 text-2xl font-bold text-ink">Log in</h1>

      {verifyNotice && (
        <div
          className={`card mb-4 p-4 text-sm ${
            verifyNotice.tone === "good" ? "border-accent/30 bg-accent-soft" : "border-flag/30 bg-flag-soft"
          }`}
        >
          {verifyNotice.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div>
          <label className="field-label" htmlFor="email">
            Email
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
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-neutral-500">
          New here?{" "}
          <Link href="/sign-up" className="text-accent underline">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
