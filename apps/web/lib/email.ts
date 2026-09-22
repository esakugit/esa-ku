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

export async function sendClassReminderEmail({
  to,
  courseCode,
  courseName,
  time,
  venue,
}: {
  to: string;
  courseCode: string;
  courseName: string;
  time: string;
  venue?: string | null;
}) {
  const transport = getTransport();
  const subject = `Class Reminder: ${courseCode} starts at ${time}`;
  const text = `Hello,\n\nYour lecture for ${courseCode} (${courseName}) is scheduled for ${time}${venue ? ` at ${venue}` : ""}.\n\nView timetable: ${env.NEXT_PUBLIC_APP_URL}/timetable\n\n— Kenyatta University Engineering Students Association`;

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff">
      <p style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#2554d7;margin:0 0 6px">Class Reminder</p>
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px">${courseCode} · ${courseName}</h2>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:16px 0">
        <p style="margin:4px 0;color:#334155;font-size:14px"><strong>Time:</strong> ${time}</p>
        ${venue ? `<p style="margin:4px 0;color:#334155;font-size:14px"><strong>Venue:</strong> ${venue}</p>` : ""}
      </div>
      <a href="${env.NEXT_PUBLIC_APP_URL}/timetable" style="display:inline-block;background:#2554d7;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;margin-top:8px">Open Timetable</a>
      <p style="font-size:11px;color:#94a3b8;margin-top:24px;border-top:1px solid #f1f5f9;padding-top:12px">Engineering Students Association · Kenyatta University</p>
    </div>
  `;

  await transport.sendMail({
    from: `"ESA Class Reminders" <${env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
