import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { testSmtpConnection } from "@/lib/email";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isEsaAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const recipient = (body && typeof body.recipient === "string" && body.recipient.includes("@"))
    ? body.recipient.trim()
    : user.email;

  try {
    const result = await testSmtpConnection(recipient);
    return NextResponse.json({
      ok: true,
      message: `Diagnostic test email dispatched successfully to ${recipient}.`,
      details: result,
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string; response?: string; responseCode?: number };
    console.error("[SMTP DIAGNOSTIC ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Failed to connect to SMTP server",
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
        hint:
          error.code === "EAUTH"
            ? "Authentication failed. For Gmail, verify 2-Step Verification is ON and you are using a 16-character App Password (not your personal Google account password)."
            : error.code === "ESOCKET" || error.code === "ETIMEDOUT"
              ? "Connection timed out. Check network or ensure port 465 / 587 is accessible."
              : "Review environment variables GMAIL_USER and GMAIL_APP_PASSWORD.",
      },
      { status: 500 },
    );
  }
}
