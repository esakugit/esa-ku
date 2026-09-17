/**
 * Bulk-loads packages/db/data/legacy-roster.json into the legacy_members
 * table — the pre-platform membership roster (from physical/Canva cards).
 *
 * Run against local dev:  pnpm import-roster
 * Run against production: DATABASE_URL="<neon connection string>" pnpm import-roster
 *
 * Safe to re-run: entries whose badge number already exists on the roster
 * are skipped (reported, not errored), so you can keep appending new cards
 * to legacy-roster.json over time and just re-run this each time.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/schema";

type RosterEntry = {
  fullName: string;
  badgeNumber: string;
  regNo?: string;
  notes?: string;
  // Filename of the scanned membership card, already placed in
  // apps/web/.storage/legacy-cards/ (see README "Legacy roster card images").
  cardImage?: string;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — copy .env.example to apps/web/.env.local and fill it in.");
  }
  const ssl = /sslmode=require/.test(url) || /neon\.tech/.test(url) ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString: url, ssl });
  const db = drizzle(pool, { schema });

  const dataPath = join(__dirname, "../data/legacy-roster.json");
  const entries: RosterEntry[] = JSON.parse(readFileSync(dataPath, "utf-8"));

  // Card scans live in apps/web/.storage (local file storage — see lib/storage.ts),
  // served at runtime through /api/files/legacy-cards/<filename>.
  const cardsDir = join(__dirname, "../../../apps/web/.storage/legacy-cards");

  function cardImageUrlFor(entry: RosterEntry): string | null {
    if (!entry.cardImage) return null;
    if (!existsSync(join(cardsDir, entry.cardImage))) {
      console.warn(`  warning: ${entry.cardImage} not found in apps/web/.storage/legacy-cards — leaving cardImageUrl blank for ${entry.badgeNumber}`);
      return null;
    }
    return `/api/files/legacy-cards/${entry.cardImage}`;
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const entry of entries) {
    const badgeNumber = entry.badgeNumber.trim().toUpperCase();
    const cardImageUrl = cardImageUrlFor(entry);
    const existing = await db.query.legacyMembers.findFirst({
      where: eq(schema.legacyMembers.badgeNumber, badgeNumber),
    });
    if (existing) {
      if (cardImageUrl && !existing.cardImageUrl) {
        await db
          .update(schema.legacyMembers)
          .set({ cardImageUrl })
          .where(eq(schema.legacyMembers.id, existing.id));
        console.log(`card  ${badgeNumber}  ${entry.fullName}  (added card image to existing roster row)`);
        updated++;
      } else {
        console.log(`skip  ${badgeNumber}  ${entry.fullName}  (already on roster)`);
        skipped++;
      }
      continue;
    }
    await db.insert(schema.legacyMembers).values({
      fullName: entry.fullName.trim(),
      badgeNumber,
      regNo: entry.regNo?.trim() || null,
      notes: entry.notes?.trim() || null,
      cardImageUrl,
    });
    console.log(`added ${badgeNumber}  ${entry.fullName}`);
    added++;
  }

  console.log(`\nDone — ${added} added, ${updated} updated with a card image, ${skipped} unchanged.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
