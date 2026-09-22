import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-16 text-center font-sans text-ink">
      <div className="w-full max-w-md card p-8 space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">404 Error</span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Document or Page Not Found</h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            The requested university resource, timetable entry, or portal page does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link href="/" className="btn-primary w-full sm:w-auto !text-xs !py-2.5">
            Return to Homepage
          </Link>
          <Link
            href="/resources"
            className="w-full sm:w-auto rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Browse Resources
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-neutral-500 font-medium">
        Kenyatta University &middot; Engineering Students Association
      </p>
    </div>
  );
}
