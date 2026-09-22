import { NextResponse } from "next/server";
import { db, users, badges } from "@esa/db";
import { desc } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

export async function GET(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";
  const roleFilter = searchParams.get("role") || "all";
  const statusFilter = searchParams.get("status") || "all";

  // Fetch all users with relations
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    with: {
      department: true,
      cohort: true,
      badges: {
        orderBy: [desc(badges.createdAt)],
      },
    },
  });

  // Calculate statistics across all members
  const stats = {
    total: allUsers.length,
    verified: allUsers.filter((u) => !!u.emailVerifiedAt).length,
    activeBadges: allUsers.filter((u) => u.badges.some((b) => b.status === "active")).length,
    pendingBadges: allUsers.filter((u) => u.badges.some((b) => b.status === "pending_verification")).length,
  };

  // Filter in memory for responsiveness and flexible fuzzy matching (name, email, regNo, badgeNumber)
  let filtered = allUsers;

  if (q) {
    filtered = filtered.filter((u) => {
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchReg = u.regNo?.toLowerCase().includes(q) ?? false;
      const matchBadge = u.badges.some((b) => b.badgeNumber?.toLowerCase().includes(q));
      return matchName || matchEmail || matchReg || matchBadge;
    });
  }

  if (roleFilter !== "all") {
    filtered = filtered.filter((u) => u.role === roleFilter);
  }

  if (statusFilter !== "all") {
    if (statusFilter === "active") {
      filtered = filtered.filter((u) => u.badges.some((b) => b.status === "active"));
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((u) => u.badges.some((b) => b.status === "pending_verification"));
    } else if (statusFilter === "unregistered") {
      filtered = filtered.filter((u) => u.badges.length === 0);
    }
  }

  // Format member summaries
  const formatted = filtered.map((u) => {
    const latestBadge = u.badges[0] || null;
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      regNo: u.regNo,
      role: u.role,
      photoBlobUrl: u.photoBlobUrl,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
      department: u.department ? { id: u.department.id, name: u.department.name, code: u.department.code } : null,
      cohort: u.cohort ? { id: u.cohort.id, label: u.cohort.label, entryYear: u.cohort.entryYear } : null,
      badge: latestBadge
        ? {
            id: latestBadge.id,
            badgeNumber: latestBadge.badgeNumber,
            status: latestBadge.status,
            paymentReference: latestBadge.paymentReference,
            academicYear: latestBadge.academicYear,
            approvedAt: latestBadge.approvedAt,
          }
        : null,
    };
  });

  return NextResponse.json({
    users: formatted,
    stats,
  });
}
