"use client";

import { useState } from "react";

export function SmtpDiagnosticCard() {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
    code?: string;
    response?: string;
    hint?: string;
  } | null>(null);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: testEmail || undefined }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        ok: false,
        error: "Network error reaching diagnostic endpoint.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 border-neutral-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-ink">SMTP & Email Dispatch Diagnostic</h3>
          <p className="text-xs text-neutral-500">
            Verify your Gmail App Password / SMTP server handshake and test live delivery.
          </p>
        </div>
        <span className="badge-pill !text-[11px] !bg-neutral-100 !text-neutral-700 !border-neutral-200">
          smtp.gmail.com:465
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <input
          type="email"
          placeholder="Recipient email (e.g. your-email@students.ku.ac.ke)"
          className="field-input !text-xs flex-1"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
        />
        <button
          type="button"
          onClick={handleTest}
          disabled={loading}
          className="btn-primary !text-xs whitespace-nowrap px-4 py-2"
        >
          {loading ? "Testing Connection..." : "Send Test Email"}
        </button>
      </div>

      {result && (
        <div
          className={`mt-4 rounded-lg p-3 text-xs border ${
            result.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <span>{result.ok ? "? SMTP Handshake Passed" : "? SMTP Delivery Failed"}</span>
          </div>
          <p className="mt-1">{result.message || result.error}</p>
          {result.code && (
            <p className="font-mono text-[11px] mt-1 text-neutral-600">
              Error Code: <strong>{result.code}</strong>
            </p>
          )}
          {result.response && (
            <p className="font-mono text-[11px] mt-1 text-neutral-600">
              Server Response: {result.response}
            </p>
          )}
          {result.hint && (
            <div className="mt-2 pt-2 border-t border-red-200/60 font-sans text-neutral-700">
              <strong>Tip:</strong> {result.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
