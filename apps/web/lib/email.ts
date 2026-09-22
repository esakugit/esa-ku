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
  const user = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();

  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER / GMAIL_APP_PASSWORD are not configured. Please add them in your Vercel Project Settings > Environment Variables.",
    );
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 7000,
    socketTimeout: 15000,
  });
}

function getAppUrl(): string {
  if (env.NEXT_PUBLIC_APP_URL && !env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return (env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function testSmtpConnection(testRecipient?: string) {
  const transport = getTransport();
  await transport.verify();

  if (testRecipient) {
    const fromUser = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();
    const info = await transport.sendMail({
      from: `"ESA Kenyatta University" <${fromUser}>`,
      to: testRecipient,
      subject: "ESA Campus Platform — SMTP Diagnostic Verification",
      text: "This is a diagnostic test email confirming that your SMTP email service is operational.\n\n— Engineering Students Association (ESA-KU)",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff">
          <h2 style="color:#0f172a;margin-top:0">SMTP Connection Verified ✓</h2>
          <p style="color:#334155;line-height:1.6">Your ESA Campus Platform SMTP email configuration is fully operational.</p>
          <div style="background:#f1f5f9;padding:12px;border-radius:6px;font-family:monospace;font-size:12px;color:#475569;margin-top:16px">
            Timestamp: ${new Date().toISOString()}<br>
            Sender: ${fromUser}
          </div>
        </div>
      `,
    });
    return { ok: true, messageId: info.messageId, response: info.response };
  }

  return { ok: true };
}

export async function sendVerificationEmail(to: string, token: string) {
  const baseUrl = getAppUrl();
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const transport = getTransport();
  const fromUser = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();

  console.log(`[SMTP] Sending verification email to ${to} from ${fromUser}...`);

  try {
    const info = await transport.sendMail({
      from: `"ESA Kenyatta University" <${fromUser}>`,
      to,
      subject: "Verify your ESA Kenyatta University account",
      text: `Welcome to the ESA Campus Platform.\n\nVerify your account: ${verifyUrl}\n\nThis link expires in 24 hours. If you didn't sign up, you can ignore this email.\n\n— Engineering Students Association (ESA-KU)`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#0f172a">
          <div style="margin-bottom:20px">
            <span style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#2554d7">Engineering Students Association</span>
            <h1 style="font-size:22px;font-weight:700;margin:6px 0 0;color:#0f172a">Verify your ESA account</h1>
          </div>
          <p style="font-size:14px;line-height:1.6;color:#334155;margin:16px 0">
            Welcome to the official Kenyatta University ESA Campus Platform. Click the button below to confirm your institutional email address and complete your profile setup.
          </p>
          <div style="margin:28px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:#2554d7;color:#ffffff;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;box-shadow:0 2px 4px rgba(37,84,215,0.2)">
              Verify My Account →
            </a>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin:20px 0">
            <p style="font-size:12px;color:#64748b;margin:0 0 4px">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size:12px;color:#2554d7;margin:0;word-break:break-all">${verifyUrl}</p>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;padding-top:16px;border-top:1px solid #f1f5f9">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`[SMTP SUCCESS] Verification email sent to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (err: unknown) {
    const error = err as { code?: string; response?: string; responseCode?: number; message?: string };
    console.error(`[SMTP ERROR] Failed to send email to ${to}:`, {
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message,
    });
    throw err;
  }
}

export async function sendBadgeDecisionEmail(
  to: string,
  decision: "active" | "rejected",
  note?: string | null,
) {
  const transport = getTransport();
  const fromUser = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();
  const subject =
    decision === "active" ? "Your ESA Badge is active" : "Update on your ESA Badge application";
  const body =
    decision === "active"
      ? "Your ESA Badge has been approved. It's now showing on your profile — thank you for supporting ESA's events."
      : `Your ESA Badge application couldn't be approved as submitted.${note ? ` Note from the committee: ${note}` : ""} You can review your payment code and resubmit from your profile.`;

  await transport.sendMail({
    from: `"ESA Kenyatta University" <${fromUser}>`,
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
  const fromUser = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();
  const subject = `Class Reminder: ${courseCode} starts at ${time}`;
  const text = `Hello,\n\nYour lecture for ${courseCode} (${courseName}) is scheduled for ${time}${venue ? ` at ${venue}` : ""}.\n\nView timetable: ${getAppUrl()}/timetable\n\n— Kenyatta University Engineering Students Association`;

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff">
      <p style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#2554d7;margin:0 0 6px">Class Reminder</p>
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px">${courseCode} · ${courseName}</h2>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:16px 0">
        <p style="margin:4px 0;color:#334155;font-size:14px"><strong>Time:</strong> ${time}</p>
        ${venue ? `<p style="margin:4px 0;color:#334155;font-size:14px"><strong>Venue:</strong> ${venue}</p>` : ""}
      </div>
      <a href="${getAppUrl()}/timetable" style="display:inline-block;background:#2554d7;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;margin-top:8px">Open Timetable</a>
      <p style="font-size:11px;color:#94a3b8;margin-top:24px;border-top:1px solid #f1f5f9;padding-top:12px">Engineering Students Association · Kenyatta University</p>
    </div>
  `;

  await transport.sendMail({
    from: `"ESA Class Reminders" <${fromUser}>`,
    to,
    subject,
    text,
    html,
  });
}
