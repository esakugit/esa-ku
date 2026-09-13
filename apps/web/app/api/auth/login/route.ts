import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users } from "@esa/db";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Please verify your email before signing in — check your inbox." },
      { status: 403 },
    );
  }

  await createSession({ userId: user.id, role: user.role });

  return NextResponse.json({ ok: true });
}
