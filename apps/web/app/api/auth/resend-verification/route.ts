import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users } from "@esa/db";
import { eq } from "drizzle-orm";
import { generateToken, tokenExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  // Don't leak whether the account exists
  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "If an account exists with this email, a verification link has been sent.",
    });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({
      ok: true,
      message: "Your email is already verified. You can log in directly.",
    });
  }

  const verificationToken = generateToken();
  await db
    .update(users)
    .set({
      verificationToken,
      verificationTokenExpiresAt: tokenExpiry(24),
    })
    .where(eq(users.id, user.id));

  let emailSent = true;
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err: unknown) {
    emailSent = false;
    const errorObj = err as { code?: string; message?: string; response?: string };
    console.error("[AUTH RESEND] Failed to send verification email:", {
      code: errorObj?.code,
      message: errorObj?.message,
      response: errorObj?.response,
    });
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    message: emailSent
      ? "A new verification link has been dispatched to your email (check your inbox and spam folder)."
      : "We created a new verification link, but the email could not be delivered.",
    ...(!emailSent || process.env.NODE_ENV !== "production"
      ? { devVerifyUrl: `/api/auth/verify?token=${verificationToken}` }
      : {}),
  });
}
