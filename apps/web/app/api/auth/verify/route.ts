import { NextResponse } from "next/server";
import { db, users } from "@esa/db";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/login?verify=missing`);
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.verificationToken, token), gt(users.verificationTokenExpiresAt, new Date())),
  });

  if (!user) {
    return NextResponse.redirect(`${origin}/login?verify=expired`);
  }

  await db
    .update(users)
    .set({
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(`${origin}/login?verify=success`);
}
