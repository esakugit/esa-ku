import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/schema";
import { eq, or } from "drizzle-orm";

const neonUrl =
  "postgresql://neondb_owner:npg_XBvSz1A6Ipoc@ep-crimson-band-avrnjfhp-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(neonUrl);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding Sustainability Dinner 2.0 event into Neon DB...");

  // Find ESA club
  const esaClub = await db.query.clubs.findFirst({
    where: or(eq(schema.clubs.slug, "esa"), eq(schema.clubs.isPlatformOwner, true)),
  });

  if (!esaClub) {
    console.error("ESA club not found in database!");
    process.exit(1);
  }

  console.log(`Found ESA Club: ${esaClub.name} (ID: ${esaClub.id})`);

  const eventTitle = "ESA-KU Sustainability Dinner 2.0";
  const existing = await db.query.events.findFirst({
    where: eq(schema.events.title, eventTitle),
  });

  const eventData = {
    clubId: esaClub.id,
    title: eventTitle,
    description: `Engineering Students Association — Kenyatta University presents the flagship ESA-KU Sustainability Dinner 2.0.

Theme: Engineering a Sustainable Future
Date: Friday, 06th November
Time: Prompt From 6:00 PM
Venue: Trademark Hotel
Evening Palette: Emerald Green : Burgundy : Black

Contact & Inquiries:
• +254 113 790 205
• +254 700 850 287
• esa.kenyattauniv@gmail.com`,
    location: "Trademark Hotel",
    startAt: new Date("2026-11-06T18:00:00+03:00"),
    endAt: new Date("2026-11-06T23:30:00+03:00"),
    coverImageBlobUrl: "/events/sustainability-dinner-2026.jpg",
    registrationUrl: "mailto:esa.kenyattauniv@gmail.com?subject=RSVP:%20ESA-KU%20Sustainability%20Dinner%202.0",
    isFeatured: true,
    publishedAt: new Date(),
  };

  if (existing) {
    console.log(`Updating existing event ID ${existing.id}...`);
    await db.update(schema.events).set(eventData).where(eq(schema.events.id, existing.id));
  } else {
    console.log("Inserting new event...");
    await db.insert(schema.events).values(eventData);
  }

  console.log("Successfully seeded Sustainability Dinner 2.0 into Neon DB!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding event:", err);
  process.exit(1);
});
