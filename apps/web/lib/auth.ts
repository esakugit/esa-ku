import "server-only";
import { db, users, badges, legacyMembers } from "@esa/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "./session";

export type CurrentUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  regNo: string | null;
  departmentId: number | null;
  cohortId: number | null;
  emailVerifiedAt: Date | null;
  hasActiveBadge: boolean;
  badgeNumber: string | null;
  /** True once department, intake year and reg. number are all set — the one signal every "finish setting up" prompt in the app checks. */
  profileComplete: boolean;
  /** Scan of their physical pre-platform membership card, once an admin has linked their legacy roster row to this account. */
  legacyCardImageUrl: string | null;
};

/**
 * Resolves the signed-in user for the current request, including whether
 * they currently hold an active Badge (spec §02) — the one flag most of the
 * app's gating decisions boil down to.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user) return null;

  const activeBadge = await db.query.badges.findFirst({
    where: and(eq(badges.userId, user.id), eq(badges.status, "active")),
  });

  const legacyMatch = await db.query.legacyMembers.findFirst({
    where: eq(legacyMembers.matchedUserId, user.id),
    columns: { cardImageUrl: true },
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    regNo: user.regNo,
    departmentId: user.departmentId,
    cohortId: user.cohortId,
    emailVerifiedAt: user.emailVerifiedAt,
    hasActiveBadge: Boolean(activeBadge),
    badgeNumber: activeBadge?.badgeNumber ?? null,
    profileComplete: Boolean(user.departmentId && user.cohortId && user.regNo),
    legacyCardImageUrl: legacyMatch?.cardImageUrl ?? null,
  };
}

/** Throws-free guard for use in Server Components/route handlers. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
