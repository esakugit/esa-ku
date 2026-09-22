import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users } from "@esa/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { generateToken, tokenExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";

// Every matriculated KU engineering student is already an ESA member (spec
// §02) — signup only proves "I'm a real student with this email", so the
// only fields collected here are identity + credentials. Department, intake
// year and registration number are all collected in exactly one other
// place — /complete-profile, right after verifying — never here too, so
// there's a single, coherent onboarding path instead of two forms asking
// for the same thing.
const signupSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { fullName, email, password } = parsed.data;

  if (
    env.ALLOWED_STUDENT_EMAIL_DOMAIN &&
    !email.toLowerCase().endsWith(`@${env.ALLOWED_STUDENT_EMAIL_DOMAIN}`)
  ) {
    return NextResponse.json(
      { error: `Please sign up with your @${env.ALLOWED_STUDENT_EMAIL_DOMAIN} university email.` },
      { status: 400 },
    );
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  // Bootstrap: on a fresh install there is no admin who could approve
  // anything, so the very first account created becomes super_admin
  // automatically. Every account after that is an ordinary student. This is
  // a one-time, count-based check — safe because signups happen one HTTP
  // request at a time and the race window (two people ever hardening the
  // very first request within milliseconds of each other) is not realistic
  // for a students' association platform.
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const isBootstrap = count === 0;

  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();

  const [user] = await db
    .insert(users)
    .values({
      fullName,
      email,
      passwordHash,
      role: isBootstrap ? "super_admin" : "student",
      verificationToken,
      verificationTokenExpiresAt: tokenExpiry(24),
    })
    .returning();

  let emailSent = true;
  let emailErrorMessage: string | null = null;
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err: unknown) {
    emailSent = false;
    const errorObj = err as { code?: string; message?: string; response?: string };
    emailErrorMessage = errorObj?.message || String(err);
    console.error("[AUTH SIGNUP] Failed to send verification email:", {
      code: errorObj?.code,
      message: errorObj?.message,
      response: errorObj?.response,
    });
  }

  return NextResponse.json({
    ok: true,
    isBootstrapAdmin: isBootstrap,
    emailSent,
    message: !emailSent
      ? isBootstrap
        ? "Account created as the founding admin, but the verification email could not be sent (SMTP configuration pending)."
        : "Account created, but the verification email could not be delivered. Please check your spam folder or verify below."
      : isBootstrap
        ? "Account created as the platform's founding admin. Check your email for a verification link."
        : "Account created. Check your inbox and spam folder for a verification link.",
    // Always provide direct verification URL if email failed or in development so users are never locked out
    ...(!emailSent || process.env.NODE_ENV !== "production"
      ? { devVerifyUrl: `/api/auth/verify?token=${verificationToken}` }
      : {}),
  });
}
