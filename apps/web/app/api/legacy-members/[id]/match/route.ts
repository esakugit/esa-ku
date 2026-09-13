import { NextResponse } from "next/server";
import { z } from "zod";
import { db, legacyMembers, badges, users } from "@esa/db";
import { eq, or } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";
import { notifyUser } from "@/lib/push";
import { sendBadgeDecisionEmail } from "@/lib/email";

const schema = z.object({
  // Look the account up by whichever the admin has handy — their login email
  // or the reg. no. they entered on complete-profile.
  identifier: z.string().trim().min(2).max(255),
});

function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${y}/${y + 1}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the member's email or reg. number." }, { status: 400 });

  const roster = await db.query.legacyMembers.findFirst({ where: eq(legacyMembers.id, Number(id)) });
  if (!roster) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (roster.matchedUserId) {
    return NextResponse.json({ error: "This roster entry is already linked to an account." }, { status: 409 });
  }

  const identifier = parsed.data.identifier.trim();
  const target = await db.query.users.findFirst({
    where: or(eq(users.email, identifier.toLowerCase()), eq(users.regNo, identifier)),
  });
  if (!target) {
    return NextResponse.json(
      { error: "No account found with that email or reg. number — ask them to sign up first." },
      { status: 404 },
    );
  }

  const existingBadge = await db.query.badges.findFirst({ where: eq(badges.userId, target.id) });
  if (existingBadge?.status === "active") {
    return NextResponse.json(
      { error: `${target.fullName} already has an active Badge (${existingBadge.badgeNumber}).` },
      { status: 409 },
    );
  }

  if (existingBadge) {
    await db
      .update(badges)
      .set({
        status: "active",
        badgeNumber: roster.badgeNumber,
        academicYear: existingBadge.academicYear ?? currentAcademicYear(),
        approvedBy: admin.id,
        approvedAt: new Date(),
        adminNote: "Linked from the pre-platform membership roster.",
      })
      .where(eq(badges.id, existingBadge.id));
  } else {
    await db.insert(badges).values({
      userId: target.id,
      badgeNumber: roster.badgeNumber,
      status: "active",
      paymentReference: "IMPORTED-ROSTER",
      academicYear: currentAcademicYear(),
      approvedBy: admin.id,
      approvedAt: new Date(),
      adminNote: "Linked from the pre-platform membership roster.",
    });
  }

  await db
    .update(legacyMembers)
    .set({ matchedUserId: target.id, matchedAt: new Date() })
    .where(eq(legacyMembers.id, roster.id));

  await notifyUser({
    userId: target.id,
    type: "badge_decision",
    title: "Your ESA Badge is active",
    body: `Badge No. ${roster.badgeNumber} — welcome back to the platform.`,
    link: "/profile",
  });
  try {
    await sendBadgeDecisionEmail(target.email, "active");
  } catch (err) {
    console.error("Badge link email failed:", err);
  }

  return NextResponse.json({ ok: true, badgeNumber: roster.badgeNumber, user: { id: target.id, fullName: target.fullName } });
}
