"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ variant = "button" }: { variant?: "button" | "row" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (variant === "row") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        {loading ? "Signing out..." : "Sign out"}
        <span aria-hidden>→</span>
      </button>
    );
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary">
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
