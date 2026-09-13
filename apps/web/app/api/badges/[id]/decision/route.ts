import { NextResponse } from "next/server";
import { z } from "zod";
import { db, badges } from "@esa/db";
import { eq, isNotNull, desc } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";
import { sendBadgeDecisionEmail } from "@/lib/email";
import { notifyUser } from "@/lib/push";

const schema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

async function nextBadgeNumber(): Promise<string> {
  const [last] = await db
    .select({ badgeNumber: badges.badgeNumber })
    .from(badges)
    .where(isNotNull(badges.badgeNumber))
    .orderBy(desc(badges.id))
    .limit(1);
  const lastN = last?.badgeNumber ? parseInt(last.badgeNumber.replace(/\D/g, ""), 10) || 0 : 0;
  return `ESA-${String(lastN + 1).padStart(4, "0")}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;
  const badgeId = Number(id);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const badge = await db.query.badges.findFirst({ where: eq(badges.id, badgeId), with: { user: true } });
  if (!badge) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (badge.status !== "pending_verification") {
    return NextResponse.json({ error: "This application was already decided." }, { status: 409 });
  }

  if (parsed.data.decision === "approve") {
    const badgeNumber = await nextBadgeNumber();
    await db
      .update(badges)
      .set({
        status: "active",
        badgeNumber,
        approvedBy: admin.id,
        approvedAt: new Date(),
        adminNote: parsed.data.note ?? null,
      })
      .where(eq(badges.id, badgeId));

    await notifyUser({
      userId: badge.userId,
      type: "badge_decision",
      title: "Your ESA Badge is active",
      body: `Badge No. ${badgeNumber} — thank you for supporting ESA.`,
      link: "/profile",
    });
    try {
      await sendBadgeDecisionEmail(badge.user.email, "active");
    } catch (err) {
      console.error("Badge approval email failed:", err);
    }
  } else {
    await db
      .update(badges)
      .set({
        status: "rejected",
        approvedBy: admin.id,
        approvedAt: new Date(),
        adminNote: parsed.data.note ?? null,
      })
      .where(eq(badges.id, badgeId));

    await notifyUser({
      userId: badge.userId,
      type: "badge_decision",
      title: "Your ESA Badge application needs another look",
      body: parsed.data.note || "Please check your payment code and resubmit.",
      link: "/profile",
    });
    try {
      await sendBadgeDecisionEmail(badge.user.email, "rejected", parsed.data.note);
    } catch (err) {
      console.error("Badge rejection email failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
