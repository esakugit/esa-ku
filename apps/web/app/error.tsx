"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Platform application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-16 text-center font-sans text-ink">
      <div className="w-full max-w-md card p-8 space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-red-600">Application Error</span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Something went wrong</h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            An unexpected error occurred while loading this portal view. Our technical team has been notified.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] text-neutral-400">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-primary w-full sm:w-auto !text-xs !py-2.5"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-neutral-500 font-medium">
        Kenyatta University &middot; Engineering Students Association
      </p>
    </div>
  );
}
