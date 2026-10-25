"use server";

import "server-only";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
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

/**
 * Locates the ESA logo on disk so Nodemailer can embed it via CID inline attachment.
 * This guarantees the logo renders in every email client without being blocked as
 * an untrusted remote image or failing in local/preview environments.
 */
function getLogoAttachment(): { filename: string; path: string; cid: string } | null {
  const possiblePaths = [
    path.join(process.cwd(), "apps", "web", "public", "brand", "logo.png"),
    path.join(process.cwd(), "public", "brand", "logo.png"),
    path.resolve(__dirname, "../../public/brand/logo.png"),
    path.resolve(__dirname, "../public/brand/logo.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return {
        filename: "esa-logo.png",
        path: p,
        cid: "esa-logo@esa.ku.ac.ke",
      };
    }
  }
  return null;
}

/**
 * Generates an institutional, responsive HTML email template featuring:
 * - Official ESA Kenyatta University logo attached via inline CID
 * - Consistent ESA engineering brand palette (#2554D7 royal blue)
 * - Clear action CTAs with copyable URL fallback boxes
 * - Institutional footer with official Paybill No. 625625 and contact details
 */
function renderBrandedEmailHtml({
  preheader,
  badgeText = "Engineering Students Association",
  title,
  subtitle,
  bodyHtml,
  ctaText,
  ctaUrl,
  footerNote,
}: {
  preheader?: string;
  badgeText?: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const baseUrl = getAppUrl();
  const logoFallbackUrl = `${baseUrl}/brand/logo.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.04);">
          
          <!-- Header with Logo and Brand -->
          <tr>
            <td style="padding:28px 28px 20px;border-bottom:1px solid #f1f5f9;background-color:#ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="56" valign="middle" style="padding-right:16px;">
                    <img src="cid:esa-logo@esa.ku.ac.ke" 
                         alt="ESA-KU" 
                         width="52" 
                         height="52" 
                         style="display:block;width:52px;height:52px;border-radius:10px;object-fit:contain;border:1px solid #e2e8f0;background-color:#ffffff;"
                         onerror="this.src='${logoFallbackUrl}'" />
                  </td>
                  <td valign="middle">
                    <span style="display:block;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#2554d7;margin-bottom:2px;">
                      ${badgeText}
                    </span>
                    <span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">
                      Kenyatta University
                    </span>
                    <span style="display:block;font-size:11px;color:#64748b;font-weight:500;">
                      School of Engineering & Architecture
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 28px 24px;">
              <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;line-height:1.3;">
                ${title}
              </h1>
              ${subtitle ? `<p style="font-size:14px;color:#64748b;margin:0 0 20px;line-height:1.5;">${subtitle}</p>` : ""}

              <div style="font-size:14px;line-height:1.65;color:#334155;margin:20px 0;">
                ${bodyHtml}
              </div>

              ${ctaUrl && ctaText ? `
                <div style="margin:28px 0 20px;">
                  <a href="${ctaUrl}" target="_blank" style="display:inline-block;background-color:#2554d7;color:#ffffff;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 2px 6px rgba(37,84,215,0.25);">
                    ${ctaText} →
                  </a>
                </div>
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-top:20px;">
                  <p style="font-size:11px;color:#64748b;margin:0 0 4px;font-weight:600;">Direct link:</p>
                  <p style="font-size:11px;color:#2554d7;margin:0;word-break:break-all;font-family:monospace;">${ctaUrl}</p>
                </div>
              ` : ""}

              ${footerNote ? `
                <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;padding-top:16px;border-top:1px solid #f1f5f9;line-height:1.5;">
                  ${footerNote}
                </p>
              ` : ""}
            </td>
          </tr>

          <!-- Institutional Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 28px;border-top:1px solid #e2e8f0;text-align:left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="font-size:11px;font-weight:700;color:#334155;margin:0 0 2px;">
                      Engineering Students Association (ESA-KU)
                    </p>
                    <p style="font-size:11px;color:#64748b;margin:0 0 8px;">
                      Official Campus Platform · Kenyatta University, Main Campus
                    </p>
                    <p style="font-size:10px;color:#94a3b8;margin:0;">
                      M-Pesa Paybill: <strong>625625</strong> · Acc: <strong>01521260661100</strong> · Support: <strong>esa.kenyattauniv@gmail.com</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function testSmtpConnection(testRecipient?: string) {
  const transport = getTransport();
  await transport.verify();

  if (testRecipient) {
    const fromUser = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();
    const logo = getLogoAttachment();
    const attachments = logo ? [logo] : [];

    const html = renderBrandedEmailHtml({
      preheader: "SMTP email delivery diagnostic test for ESA Campus Platform.",
      badgeText: "SMTP Diagnostic Service",
      title: "SMTP Connection Verified ✓",
      subtitle: "Your email configuration is fully operational.",
      bodyHtml: `
        <p>This is an automated test email confirming that your Gmail SMTP credentials and outbound email dispatch service are operating properly.</p>
        <div style="background-color:#f1f5f9;padding:14px;border-radius:8px;font-family:monospace;font-size:12px;color:#475569;margin-top:16px;line-height:1.6;">
          <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
          <strong>Outbound Sender:</strong> ${fromUser}<br>
          <strong>Logo Asset Attached:</strong> ${logo ? "Yes (CID: esa-logo@esa.ku.ac.ke)" : "No (fallback URL)"}
        </div>
      `,
      footerNote: "This diagnostic email was triggered from the ESA Platform Admin Management Console.",
    });

    const info = await transport.sendMail({
      from: `"ESA Kenyatta University" <${fromUser}>`,
      to: testRecipient,
      subject: "ESA Campus Platform — SMTP Diagnostic Verification",
      text: "This is a diagnostic test email confirming that your SMTP email service is operational.\n\n— Engineering Students Association (ESA-KU)",
      html,
      attachments,
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
  const logo = getLogoAttachment();
  const attachments = logo ? [logo] : [];

  console.log(`[SMTP] Sending branded verification email to ${to} from ${fromUser}...`);

  const html = renderBrandedEmailHtml({
    preheader: "Verify your email to activate your Kenyatta University ESA account.",
    title: "Verify your ESA account",
    subtitle: "Welcome to the Engineering Students Association platform.",
    bodyHtml: `
      <p style="margin-top:0;">Welcome to the official Kenyatta University ESA Campus Platform. Confirming your institutional email allows you to access your cohort timetable, engineering resources, and active student membership benefits.</p>
      <p>Click the button below to verify your email address and complete your account setup:</p>
    `,
    ctaText: "Verify My Account",
    ctaUrl: verifyUrl,
    footerNote: "This verification link expires in 24 hours. If you did not sign up for an ESA account, you can safely ignore this email.",
  });

  try {
    const info = await transport.sendMail({
      from: `"ESA Kenyatta University" <${fromUser}>`,
      to,
      subject: "Verify your ESA Kenyatta University account",
      text: `Welcome to the ESA Campus Platform.\n\nVerify your account: ${verifyUrl}\n\nThis link expires in 24 hours. If you didn't sign up, you can ignore this email.\n\n— Engineering Students Association (ESA-KU)`,
      html,
      attachments,
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
  badgeNumber?: string | null,
) {
  const transport = getTransport();
  const fromUser = (process.env.SMTP_USER || env.GMAIL_USER || "").trim();
  const baseUrl = getAppUrl();
  const profileUrl = `${baseUrl}/profile`;
  const logo = getLogoAttachment();
  const attachments = logo ? [logo] : [];

  const subject =
    decision === "active"
      ? "Your ESA Membership Badge is Active! 🎖️"
      : "Update regarding your ESA Badge application";

  let title = "";
  let bodyHtml = "";
  let ctaText = "View My Profile & Badge";

  if (decision === "active") {
    title = "ESA Badge Approved & Issued";
    bodyHtml = `
      <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:16px;margin-bottom:20px;">
        <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#047857;letter-spacing:1px;display:block;margin-bottom:4px;">
          Badge Verified
        </span>
        <span style="font-size:24px;font-weight:900;color:#065f46;font-family:monospace;letter-spacing:1px;">
          ${badgeNumber || "ESA MEMBER"}
        </span>
      </div>
      <p style="margin-top:0;">Your ESA Membership Badge has been officially approved and activated by the Executive Committee. Thank you for supporting ESA Kenyatta University!</p>
      <p><strong>Your activated benefits include:</strong></p>
      <ul style="padding-left:20px;color:#334155;line-height:1.7;">
        <li>Automated push and in-app reminders prior to your scheduled lectures.</li>
        <li>Full cross-departmental timetable browsing.</li>
        <li>Voting rights in ESA General Elections and discounted entry to ESA workshops and summits.</li>
        <li>Access to elevated leadership roles (Class Rep, Technical Chapter Committee, ExCom).</li>
      </ul>
    `;
  } else {
    title = "Badge Application Update";
    ctaText = "Review Application on Profile";
    bodyHtml = `
      <p style="margin-top:0;">Your ESA Badge application could not be approved as submitted.</p>
      ${note ? `
        <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin:16px 0;">
          <strong style="color:#b91c1c;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Note from the Committee:</strong>
          <p style="color:#7f1d1d;margin:4px 0 0;font-size:13px;">${note}</p>
        </div>
      ` : ""}
      <p>Please check your M-Pesa transaction confirmation code and re-submit your application through your profile page.</p>
    `;
  }

  const html = renderBrandedEmailHtml({
    preheader: decision === "active" ? "Your ESA Badge is now active." : "Update on your ESA Badge application.",
    badgeText: "Membership Department",
    title,
    bodyHtml,
    ctaText,
    ctaUrl: profileUrl,
    footerNote: "Questions regarding your membership badge? Contact the ESA Treasurer at esa.kenyattauniv@gmail.com.",
  });

  await transport.sendMail({
    from: `"ESA Kenyatta University" <${fromUser}>`,
    to,
    subject,
    text: decision === "active"
      ? `Your ESA Badge is now active (${badgeNumber || ""}). View your profile: ${profileUrl}`
      : `Your ESA Badge application could not be approved. ${note ? `Note: ${note}` : ""}\nReview: ${profileUrl}`,
    html,
    attachments,
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
  const baseUrl = getAppUrl();
  const timetableUrl = `${baseUrl}/timetable`;
  const logo = getLogoAttachment();
  const attachments = logo ? [logo] : [];

  const subject = `Lecture Reminder: ${courseCode} starts at ${time}`;
  const text = `Hello,\n\nYour lecture for ${courseCode} (${courseName}) is scheduled for ${time}${venue ? ` at ${venue}` : ""}.\n\nView timetable: ${timetableUrl}\n\n— Kenyatta University Engineering Students Association`;

  const html = renderBrandedEmailHtml({
    preheader: `Upcoming class alert: ${courseCode} starts at ${time}.`,
    badgeText: "Daily Academic Schedule",
    title: `${courseCode} · ${courseName}`,
    subtitle: `Scheduled lecture alert for Kenyatta University engineering students.`,
    bodyHtml: `
      <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#334155;">
              <strong style="color:#0f172a;">🕒 Time:</strong> ${time}
            </td>
          </tr>
          ${venue ? `
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#334155;">
                <strong style="color:#0f172a;">📍 Venue:</strong> ${venue}
              </td>
            </tr>
          ` : ""}
        </table>
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#64748b;">
        Please make your way to the lecture hall in good time. You can check the complete daily schedule on the platform.
      </p>
    `,
    ctaText: "Open Timetable",
    ctaUrl: timetableUrl,
    footerNote: "You are receiving this reminder because you subscribed to class alerts with your active ESA Badge.",
  });

  await transport.sendMail({
    from: `"ESA Class Alerts" <${fromUser}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
