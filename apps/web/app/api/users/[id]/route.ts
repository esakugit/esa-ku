import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users, badges, departments, cohorts } from "@esa/db";
import { eq, desc } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";
import { generateUniqueBadgeNumber } from "@/lib/badgeNumber";
import { notifyUser } from "@/lib/push";

function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${y}/${y + 1}`;
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify_email"),
  }),
  z.object({
    action: z.literal("assign_badge"),
    badgeNumber: z.string().optional(),
    status: z.enum(["active", "pending_verification", "expired", "rejected"]).default("active"),
  }),
  z.object({
    action: z.literal("update_role"),
    role: z.enum(["student", "class_rep", "club_admin", "esa_admin"]),
    cohortId: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("update_profile"),
    regNo: z.string().min(2).max(30).optional(),
    departmentId: z.number().int().positive().nullable().optional(),
    cohortId: z.number().int().positive().nullable().optional(),
  }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

  const target = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      badges: {
        orderBy: [desc(badges.createdAt)],
      },
    },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const { action } = parsed.data;

  // 1. Manually verify member's email
  if (action === "verify_email") {
    await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
    return NextResponse.json({ ok: true, message: "Member email verified successfully" });
  }

  // 2. Assign / Activate Membership Badge
  if (action === "assign_badge") {
    let finalBadgeNumber = parsed.data.badgeNumber?.trim().toUpperCase();
    if (!finalBadgeNumber) {
      finalBadgeNumber = await generateUniqueBadgeNumber();
    }

    const latestBadge = target.badges[0];
    if (latestBadge) {
      await db
        .update(badges)
        .set({
          badgeNumber: finalBadgeNumber,
          status: parsed.data.status,
          approvedBy: admin.id,
          approvedAt: new Date(),
        })
        .where(eq(badges.id, latestBadge.id));
    } else {
      await db.insert(badges).values({
        userId,
        badgeNumber: finalBadgeNumber,
        status: parsed.data.status,
        paymentReference: "ADMIN-ACTIVATED",
        academicYear: currentAcademicYear(),
        approvedBy: admin.id,
        approvedAt: new Date(),
      });
    }

    if (parsed.data.status === "active") {
      await notifyUser({
        userId,
        type: "badge_decision",
        title: "Your ESA Membership Badge is active",
        body: `Badge No. ${finalBadgeNumber} — your official ESA card is now active.`,
        link: "/profile",
      });
    }

    return NextResponse.json({ ok: true, badgeNumber: finalBadgeNumber, status: parsed.data.status });
  }

  // 3. Update Role
  if (action === "update_role") {
    if (target.role === "super_admin") {
      return NextResponse.json({ error: "Cannot modify a Super Admin's role." }, { status: 400 });
    }

    if (parsed.data.role === "class_rep") {
      const cohortId = parsed.data.cohortId ?? target.cohortId;
      if (!cohortId) {
        return NextResponse.json(
          { error: "Student must have a cohort before being assigned class rep." },
          { status: 400 },
        );
      }
      await db.update(users).set({ role: "class_rep", cohortId, updatedAt: new Date() }).where(eq(users.id, userId));
    } else {
      await db.update(users).set({ role: parsed.data.role, updatedAt: new Date() }).where(eq(users.id, userId));
    }

    return NextResponse.json({ ok: true, role: parsed.data.role });
  }

  // 4. Update Profile details (regNo, department, cohort)
  if (action === "update_profile") {
    const updateData: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (parsed.data.regNo !== undefined) updateData.regNo = parsed.data.regNo.trim().toUpperCase();
    if (parsed.data.departmentId !== undefined) updateData.departmentId = parsed.data.departmentId;
    if (parsed.data.cohortId !== undefined) updateData.cohortId = parsed.data.cohortId;

    await db.update(users).set(updateData).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
