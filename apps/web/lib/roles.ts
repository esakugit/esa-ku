import "server-only";
import { db, clubAdmins } from "@esa/db";
import { and, eq } from "drizzle-orm";
import type { CurrentUser } from "./auth";

/**
 * Central place for the one rule that recurs across the app (spec §02/§03):
 * class_rep, club_admin and esa_admin are only meaningful while the holder
 * has an active Badge. super_admin is the bootstrap/root account (normally
 * just the person who first signs up on a fresh install, see §04 in
 * apps/web/app/api/auth/signup/route.ts) and is exempt — requiring the one
 * person who can approve Badges to already hold one is circular.
 */
export function roleIsCurrentlyGranted(user: Pick<CurrentUser, "role" | "hasActiveBadge">): boolean {
  if (user.role === "student") return true;
  if (user.role === "super_admin") return true;
  return user.hasActiveBadge;
}

/** True if the user may act as an ESA admin (Badge queue, moderation, seed data). */
export function isEsaAdmin(user: Pick<CurrentUser, "role" | "hasActiveBadge">): boolean {
  if (user.role === "super_admin") return true;
  return user.role === "esa_admin" && user.hasActiveBadge;
}

/** True if the user may manage a specific club's events/resources. */
export async function isClubAdminFor(
  user: Pick<CurrentUser, "id" | "role" | "hasActiveBadge">,
  clubId: number,
): Promise<boolean> {
  if (isEsaAdmin(user)) return true; // ESA committee / Super Admin can manage any club
  if (user.role !== "club_admin") return false;

  const membership = await db.query.clubAdmins.findFirst({
    where: and(eq(clubAdmins.userId, user.id), eq(clubAdmins.clubId, clubId)),
  });
  return Boolean(membership);
}

/** True if the user may edit a cohort's timetable. */
export function isClassRepFor(
  user: Pick<CurrentUser, "role" | "cohortId" | "hasActiveBadge">,
  cohortId: number,
): boolean {
  if (user.role === "esa_admin" || user.role === "super_admin") return true;
  return user.role === "class_rep" && user.cohortId === cohortId;
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
