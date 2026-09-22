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

  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (err) {
    console.error("Failed to resend verification email:", err);
    return NextResponse.json(
      { error: "Could not send verification email at this moment. Please check server configuration." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "A new verification link has been sent to your email.",
  });
}
