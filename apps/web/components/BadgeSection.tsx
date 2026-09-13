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
  tillNumber,
  tillName,
}: {
  fullName: string;
  hasActiveBadge: boolean;
  badgeNumber: string | null;
  tillNumber: string;
  tillName: string;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<Badge[]>([]);
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/badges").then((r) => r.json()).then(setHistory);
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

  if (hasActiveBadge) {
    return (
      <div className="card mb-6 overflow-hidden bg-gradient-to-br from-accent to-brandgreen p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">ESA Badge</p>
            <p className="mt-2 text-lg font-bold">{fullName}</p>
            <p className="mt-1 text-sm opacity-90">Badge No. {badgeNumber}</p>
            <p className="mt-3 text-xs opacity-75">
              Active — unlocks notifications, cross-department timetables and elevated roles.
            </p>
          </div>
          <Image src="/brand/logo.png" alt="" width={56} height={32} className="rounded bg-white/90 p-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-6 p-5">
      <p className="text-sm font-semibold text-ink">Get your ESA Badge</p>
      <p className="mt-1 text-sm text-neutral-600">
        Pay to the till below, then paste the M-Pesa confirmation code — an ESA admin verifies it
        and activates your Badge.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-neutral-100 px-4 py-3">
        <div>
          <p className="text-xs text-neutral-500">Buy Goods Till Number</p>
          <p className="text-lg font-bold tracking-wide text-ink">{tillNumber}</p>
        </div>
        <p className="text-sm text-neutral-600">{tillName}</p>
      </div>

      {pending ? (
        <div className="mt-4 rounded-lg border border-flag/30 bg-flag-soft p-3 text-sm text-flag">
          Application submitted (code {pending.paymentReference}) — awaiting verification.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          {lastRejected && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Your last application wasn't approved
              {lastRejected.adminNote ? `: ${lastRejected.adminNote}` : "."} You can resubmit below.
            </p>
          )}
          <div>
            <label className="field-label" htmlFor="paymentReference">
              M-Pesa confirmation code
            </label>
            <input
              id="paymentReference"
              required
              minLength={4}
              className="field-input font-mono uppercase"
              placeholder="e.g. QGH4X7YABC"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Submitting..." : "Submit for verification"}
          </button>
        </form>
      )}
    </div>
  );
}
