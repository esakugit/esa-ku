"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Badge = {
  id: number;
  status: "pending_verification" | "active" | "expired" | "rejected";
  badgeNumber: string | null;
  academicYear: string | null;
  adminNote: string | null;
  paymentReference: string;
};

export function BadgeSection({
  fullName,
  hasActiveBadge,
  badgeNumber,
  regNo,
  tillNumber,
  tillName,
  badgeFee = "200",
  legacyCardImageUrl,
}: {
  fullName: string;
  hasActiveBadge: boolean;
  badgeNumber: string | null;
  regNo?: string | null;
  tillNumber: string;
  tillName: string;
  badgeFee?: string;
  /** Scan of physical membership card if linked from legacy roster */
  legacyCardImageUrl?: string | null;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<Badge[]>([]);
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"digital" | "physical">(
    legacyCardImageUrl ? "physical" : "digital"
  );

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  const pending = history.find((b) => b.status === "pending_verification");
  const lastRejected = !pending && history.find((b) => b.status === "rejected");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReference }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setPaymentReference("");
      setHistory((h) => [data, ...h]);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* ─── 1. Bank Card Container ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Membership Card
          </p>
          {legacyCardImageUrl && (
            <div className="flex items-center gap-1 rounded-md bg-neutral-100 p-0.5 text-xs font-medium text-neutral-600">
              <button
                type="button"
                onClick={() => setViewMode("digital")}
                className={`rounded px-2.5 py-1 transition-colors ${
                  viewMode === "digital"
                    ? "bg-white font-bold text-ink shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                Digital Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode("physical")}
                className={`rounded px-2.5 py-1 transition-colors ${
                  viewMode === "physical"
                    ? "bg-white font-bold text-ink shadow-xs"
                    : "hover:text-ink"
                }`}
              >
                Original Card Scan
              </button>
            </div>
          )}
        </div>

        {/* Physical Scanned Card View */}
        {viewMode === "physical" && legacyCardImageUrl ? (
          <div className="relative mx-auto w-full max-w-[500px] aspect-[85.6/54] overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-900 shadow-xl">
            <img
              src={legacyCardImageUrl}
              alt={`${fullName}'s ESA membership card`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          /* Standard Bank Card Geometry (85.60 mm x 53.98 mm ratio) */
          <div className="relative mx-auto w-full max-w-[500px] aspect-[85.6/54] select-none overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-tr from-[#0a1128] via-[#101f42] to-[#1c356e] p-5 sm:p-6 text-white shadow-2xl transition-transform hover:scale-[1.01]">
            {/* Background subtle micro-circuit watermark pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}
            />

            {/* Gloss reflection line across card */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex h-full flex-col justify-between">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300">
                    Kenyatta University
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold tracking-tight text-white">
                    Engineering Students Association
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-neutral-400">
                    School of Engineering & Architecture
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded bg-white/10 p-1 backdrop-blur-xs">
                    <Image
                      src="/brand/logo.png"
                      alt="ESA"
                      width={38}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Section: Smart Chip & Contactless Waves */}
              <div className="my-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Realistic EMV Gold Smart Chip */}
                  <div className="relative h-7 w-9 sm:h-8 sm:w-11 rounded bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-600/60 shadow-inner overflow-hidden">
                    <div className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-amber-700/50" />
                    <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-amber-700/50" />
                    <div className="absolute inset-1 rounded-xs border border-amber-700/40" />
                  </div>

                  {/* Contactless waves icon */}
                  <svg
                    className="h-5 w-5 text-white/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" d="M8.5 16.5a5 5 0 010-9" />
                    <path strokeLinecap="round" d="M12 19a8.5 8.5 0 000-14" />
                    <path strokeLinecap="round" d="M15.5 21.5a12 12 0 000-19" />
                  </svg>
                </div>

                {/* Status Indicator */}
                {hasActiveBadge ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-emerald-300 border border-emerald-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Member
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-amber-300 border border-amber-400/30">
                    Inactive
                  </span>
                )}
              </div>

              {/* Card Footer: Member Name & Badge Number */}
              <div className="space-y-1">
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                      Member Name
                    </p>
                    <p className="truncate font-mono text-sm sm:text-base font-bold tracking-wider text-white uppercase drop-shadow-sm">
                      {fullName}
                    </p>
                  </div>

                  {regNo && (
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                        Reg No.
                      </p>
                      <p className="font-mono text-xs sm:text-sm font-bold text-neutral-200">
                        {regNo}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[9px] sm:text-[10px] text-neutral-300">
                  <span className="font-mono tracking-widest">
                    {hasActiveBadge && badgeNumber
                      ? `NO. ${badgeNumber}`
                      : "MEMBERSHIP CARD"}
                  </span>
                  <span className="tracking-wider uppercase text-neutral-400">
                    Valid: 2026/2027 Academic Year
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. Activation / Payment Box (Shown when not active) ──────────── */}
      {!hasActiveBadge && (
        <div className="card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Activate Membership Card</h3>
            <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">
              Pay the annual membership fee via M-Pesa to activate your official card.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-neutral-50 px-4 py-3 border border-neutral-200">
            <div>
              <p className="text-xs font-semibold text-neutral-500">M-Pesa Buy Goods Till</p>
              <p className="text-xl font-black tracking-wide text-ink">{tillNumber}</p>
              <p className="text-xs font-medium text-neutral-600">{tillName}</p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-neutral-200 pt-2 sm:pt-0 sm:pl-4 text-left sm:text-right">
              <p className="text-xs font-semibold text-neutral-500">Annual Membership</p>
              <p className="text-lg font-extrabold text-accent">KES {badgeFee}</p>
              <span className="text-[10px] text-neutral-400">1 Academic Year</span>
            </div>
          </div>

          {pending ? (
            <div className="rounded-lg border border-flag/30 bg-flag-soft p-3 text-xs sm:text-sm text-flag">
              Application submitted with code <strong>{pending.paymentReference}</strong>. An ESA admin will verify it shortly.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              {lastRejected && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
                  Your last code was not approved
                  {lastRejected.adminNote ? `: ${lastRejected.adminNote}` : "."} Please check your M-Pesa SMS and resubmit below.
                </p>
              )}
              <div>
                <label className="field-label" htmlFor="paymentReference">
                  M-Pesa Confirmation Code
                </label>
                <input
                  id="paymentReference"
                  required
                  minLength={8}
                  maxLength={15}
                  className="field-input font-mono uppercase tracking-wider font-semibold"
                  placeholder="e.g. SLK89PQ21"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value.toUpperCase())}
                />
              </div>
              {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full !text-xs sm:!text-sm">
                {loading ? "Submitting..." : "Submit for Verification"}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
