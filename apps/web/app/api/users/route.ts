import { NextResponse } from "next/server";
import { db, users, badges, departments, cohorts } from "@esa/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const admin = await requireApiEsaAdmin();
    if (isResponse(admin)) return admin;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const roleFilter = searchParams.get("role") || "all";
    const statusFilter = searchParams.get("status") || "all";

    // Fetch all users using explicit joins — compatible with both neon-http (prod)
    // and node-postgres (dev).
    const allUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        regNo: users.regNo,
        role: users.role,
        photoBlobUrl: users.photoBlobUrl,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,
        cohortId: cohorts.id,
        cohortLabel: cohorts.label,
        cohortEntryYear: cohorts.entryYear,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(cohorts, eq(users.cohortId, cohorts.id))
      .orderBy(desc(users.createdAt));

    // Fetch all badges in one query and group by userId
    const allBadges = await db
      .select()
      .from(badges)
      .orderBy(desc(badges.createdAt));

    const badgesByUser = new Map<number, typeof allBadges>();
    for (const b of allBadges) {
      if (!badgesByUser.has(b.userId)) badgesByUser.set(b.userId, []);
      badgesByUser.get(b.userId)!.push(b);
    }

    // Shape into rich user objects
    const richUsers = allUsers.map((u) => {
      const userBadges = badgesByUser.get(u.id) ?? [];
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        regNo: u.regNo,
        role: u.role,
        photoBlobUrl: u.photoBlobUrl,
        emailVerifiedAt: u.emailVerifiedAt,
        createdAt: u.createdAt,
        department:
          u.departmentId != null
            ? { id: u.departmentId, name: u.departmentName!, code: u.departmentCode! }
            : null,
        cohort:
          u.cohortId != null
            ? { id: u.cohortId, label: u.cohortLabel!, entryYear: u.cohortEntryYear! }
            : null,
        badges: userBadges,
      };
    });

    // Calculate statistics across all members
    const stats = {
      total: richUsers.length,
      verified: richUsers.filter((u) => !!u.emailVerifiedAt).length,
      activeBadges: richUsers.filter((u) => u.badges.some((b) => b.status === "active")).length,
      pendingBadges: richUsers.filter((u) =>
        u.badges.some((b) => b.status === "pending_verification")
      ).length,
    };

    // Filter in memory for flexible fuzzy matching
    let filtered = richUsers;

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
        filtered = filtered.filter((u) =>
          u.badges.some((b) => b.status === "pending_verification")
        );
      } else if (statusFilter === "unregistered") {
        filtered = filtered.filter((u) => u.badges.length === 0);
      }
    }

    // Format member summaries
    const formatted = filtered.map((u) => {
      const latestBadge = u.badges[0] ?? null;
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        regNo: u.regNo,
        role: u.role,
        photoBlobUrl: u.photoBlobUrl,
        emailVerifiedAt: u.emailVerifiedAt,
        createdAt: u.createdAt,
        department: u.department,
        cohort: u.cohort,
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

    return NextResponse.json({ users: formatted, stats });
  } catch (err) {
    console.error("[api/users GET error]:", err);
    return NextResponse.json(
      { error: "Internal server error fetching members", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
