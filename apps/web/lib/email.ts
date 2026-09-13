import "server-only";
import nodemailer from "nodemailer";
import { env } from "./env";

/**
 * Sends account email over plain Gmail SMTP (spec §09) — verification links
 * and Badge decisions only, never the recurring reminder stream, so this
 * stays well under Gmail's free sending cap even at a few thousand students.
 *
 * Requires a dedicated ESA Gmail account with 2-Step Verification on, and an
 * App Password (not the normal account password) in GMAIL_APP_PASSWORD.
 * https://myaccount.google.com/apppasswords
 */
function getTransport() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    throw new Error(
      "GMAIL_USER / GMAIL_APP_PASSWORD are not set — email sending is disabled until configured (see .env.example).",
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const transport = getTransport();

  await transport.sendMail({
    from: `"ESA Kenyatta University" <${env.GMAIL_USER}>`,
    to,
    subject: "Verify your ESA account",
    text: `Welcome to the ESA Campus Platform.\n\nVerify your account: ${verifyUrl}\n\nThis link expires in 24 hours. If you didn't sign up, you can ignore this email.`,
    html: `
      <p>Welcome to the ESA Campus Platform.</p>
      <p><a href="${verifyUrl}">Verify your account</a></p>
      <p style="color:#666;font-size:13px">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
    `,
  });
}

export async function sendBadgeDecisionEmail(
  to: string,
  decision: "active" | "rejected",
  note?: string | null,
) {
  const transport = getTransport();
  const subject =
    decision === "active" ? "Your ESA Badge is active" : "Update on your ESA Badge application";
  const body =
    decision === "active"
      ? "Your ESA Badge has been approved. It's now showing on your profile — thank you for supporting ESA's events."
      : `Your ESA Badge application couldn't be approved as submitted.${note ? ` Note from the committee: ${note}` : ""} You can review your payment code and resubmit from your profile.`;

  await transport.sendMail({
    from: `"ESA Kenyatta University" <${env.GMAIL_USER}>`,
    to,
    subject,
    text: body,
    html: `<p>${body}</p>`,
  });
}
