import { db, badges, legacyMembers } from "@esa/db";
import { eq } from "drizzle-orm";

/**
 * ESA Badge numbers are "ESA-" + 4 random digits (0000–9999), matching the
 * numbering already printed on existing physical/Canva membership cards —
 * those aren't sequential, so we can't just increment a counter. Instead we
 * draw a random 4-digit code and retry on collision against both the live
 * `badges` table and the `legacy_members` roster of already-issued numbers.
 */
export async function generateUniqueBadgeNumber(): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const n = Math.floor(Math.random() * 10000);
    const candidate = `ESA-${String(n).padStart(4, "0")}`;

    const [takenLive, takenLegacy] = await Promise.all([
      db.query.badges.findFirst({ where: eq(badges.badgeNumber, candidate) }),
      db.query.legacyMembers.findFirst({ where: eq(legacyMembers.badgeNumber, candidate) }),
    ]);
    if (!takenLive && !takenLegacy) return candidate;
  }
  throw new Error("Could not generate a unique badge number — the ESA-#### space may be nearly exhausted.");
}
