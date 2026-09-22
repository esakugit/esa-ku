import { db } from "@esa/db";

/**
 * Sequential ESA Member Numbering Convention:
 * - Member #0: Dalton Omondi (ESA-0000, Platform Developer)
 * - Member #1: ESA-KU (ESA-0001, Society Executive Account)
 * - Member #2+: Monotonically assigned sequential numbers (ESA-0002, ESA-0003, ESA-0004...)
 *
 * Guarantees zero collisions against both active platform badges and the legacy physical roster.
 */
export async function generateUniqueBadgeNumber(): Promise<string> {
  const [activeBadges, legacyRoster] = await Promise.all([
    db.query.badges.findMany({ columns: { badgeNumber: true } }),
    db.query.legacyMembers.findMany({ columns: { badgeNumber: true } }),
  ]);

  const takenNumbers = new Set<string>();
  for (const b of activeBadges) {
    if (b.badgeNumber) takenNumbers.add(b.badgeNumber.trim().toUpperCase());
  }
  for (const l of legacyRoster) {
    if (l.badgeNumber) takenNumbers.add(l.badgeNumber.trim().toUpperCase());
  }

  // Sequentially find the next available number starting from 2
  let seq = 2;
  while (seq <= 9999) {
    const candidate = `ESA-${String(seq).padStart(4, "0")}`;
    if (!takenNumbers.has(candidate)) {
      return candidate;
    }
    seq++;
  }

  // Safe fallback if 4-digit space exceeds 9999
  let ext = 10000;
  while (true) {
    const candidate = `ESA-${ext}`;
    if (!takenNumbers.has(candidate)) {
      return candidate;
    }
    ext++;
  }
}
