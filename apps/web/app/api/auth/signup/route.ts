import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users, cohorts, departments } from "@esa/db";
import { eq, and, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { generateToken, tokenExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";

// Every matriculated KU engineering student is already an ESA member (spec
// §02) — signup only proves "I'm a real student with this email", so the
// only required fields are identity + credentials. Department/cohort can be
// picked now or completed later from /profile once departments exist —
// which matters on a fresh install, see the bootstrap note below.
const signupSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  departmentId: z.number().int().positive().optional(),
  entryYear: z.number().int().min(2015).max(new Date().getFullYear() + 1).optional(),
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
  const { fullName, email, password, departmentId, entryYear } = parsed.data;

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

  // Resolve/create the cohort only if a department was chosen at signup.
  let cohortId: number | null = null;
  if (departmentId && entryYear) {
    let cohort = await db.query.cohorts.findFirst({
      where: and(eq(cohorts.departmentId, departmentId), eq(cohorts.entryYear, entryYear)),
    });
    if (!cohort) {
      const department = await db.query.departments.findFirst({
        where: eq(departments.id, departmentId),
      });
      if (!department) {
        return NextResponse.json({ error: "Unknown department." }, { status: 400 });
      }
      const [created] = await db
        .insert(cohorts)
        .values({
          departmentId,
          entryYear,
          label: `${department.name} · intake ${entryYear}`,
        })
        .returning();
      cohort = created;
    }
    cohortId = cohort.id;
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
      departmentId: departmentId ?? null,
      cohortId,
      role: isBootstrap ? "super_admin" : "student",
      verificationToken,
      verificationTokenExpiresAt: tokenExpiry(24),
    })
    .returning();

  let emailSent = true;
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err) {
    emailSent = false;
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({
    ok: true,
    isBootstrapAdmin: isBootstrap,
    message: isBootstrap
      ? "Account created as the platform's founding admin. Check your email for a verification link."
      : emailSent
        ? "Account created. Check your email for a verification link."
        : "Account created, but the verification email could not be sent — email isn't configured yet.",
    // Dev convenience only: lets you verify locally without Gmail set up.
    ...(process.env.NODE_ENV !== "production" && !emailSent
      ? { devVerifyUrl: `/api/auth/verify?token=${verificationToken}` }
      : {}),
  });
}
