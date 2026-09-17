import "dotenv/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";

// Ensure environment variables from apps/web/.env.local or .env are loaded
const envFiles = [
  path.resolve(__dirname, "../../../apps/web/.env.local"),
  path.resolve(__dirname, "../../../apps/web/.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Cannot run database seed.");
  }

  const ssl =
    process.env.NODE_ENV === "production" ||
    /sslmode=require/.test(url) ||
    /neon\.tech/.test(url) ||
    /supabase\./.test(url)
      ? { rejectUnauthorized: false }
      : false;

  const pool = new Pool({ connectionString: url, ssl });
  const db = drizzle(pool, { schema });

  console.log("🌱 Starting Kenyatta University ESA Platform database seed...");

  // 1. Seed Departments
  const departmentsData = [
    {
      name: "Electrical & Electronic Engineering",
      code: "EEE",
      description: "Power systems, electronics, telecommunications, instrumentation, and control systems.",
    },
    {
      name: "Mechanical & Manufacturing Engineering",
      code: "MME",
      description: "Thermodynamics, fluid mechanics, CAD/CAM design, manufacturing, and materials science.",
    },
    {
      name: "Civil & Construction Engineering",
      code: "CE",
      description: "Structural engineering, geotechnical, transportation, environmental, and infrastructure design.",
    },
    {
      name: "Mechatronic Engineering",
      code: "MCE",
      description: "Robotics, automated manufacturing, microcontrollers, embedded firmware, and smart machinery.",
    },
    {
      name: "Agricultural & Biosystems Engineering",
      code: "ABE",
      description: "Soil and water conservation, precision mechanization, agro-processing, and bio-energy systems.",
    },
    {
      name: "Aerospace Engineering",
      code: "ASE",
      description: "Aerodynamics, flight mechanics, aircraft structures, propulsion, and avionics.",
    },
    {
      name: "Petroleum & Mining Engineering",
      code: "PME",
      description: "Drilling technology, reservoir characterization, mineral processing, and geomechanics.",
    },
  ];

  const departmentMap = new Map<string, number>();

  for (const dept of departmentsData) {
    const existing = await db.query.departments.findFirst({
      where: eq(schema.departments.code, dept.code),
    });

    if (existing) {
      console.log(`  ✓ Department exists: ${dept.name} (${dept.code})`);
      departmentMap.set(dept.code, existing.id);
    } else {
      const [inserted] = await db
        .insert(schema.departments)
        .values(dept)
        .returning();
      console.log(`  + Created Department: ${inserted.name} (${inserted.code})`);
      departmentMap.set(dept.code, inserted.id);
    }
  }

  // 2. Seed Cohorts (Years 1-5 for each Department)
  const currentYear = 2026;
  for (const [code, deptId] of departmentMap.entries()) {
    for (let year = 1; year <= 5; year++) {
      const entryYear = currentYear - (year - 1);
      const label = `Year ${year} (${entryYear} Intake)`;

      const existingCohort = await db.query.cohorts.findFirst({
        where: and(
          eq(schema.cohorts.departmentId, deptId),
          eq(schema.cohorts.entryYear, entryYear)
        ),
      });

      if (!existingCohort) {
        await db.insert(schema.cohorts).values({
          departmentId: deptId,
          entryYear,
          label,
        });
        console.log(`    + Cohort: ${code} - ${label}`);
      }
    }
  }

  // 3. Seed Official Clubs & Student Chapters
  const clubsData = [
    {
      name: "Engineering Students Association (ESA)",
      slug: "esa",
      category: "Societies",
      isPlatformOwner: true,
      description:
        "The official student governance and professional development society representing all engineering scholars at Kenyatta University.",
      externalUrl: "https://www.ku.ac.ke",
    },
    {
      name: "IEEE Kenyatta University Student Branch",
      slug: "ieee-ku",
      category: "Technical Chapters",
      isPlatformOwner: false,
      description:
        "Advancing technology for humanity through software workshops, hackathons, robotics challenges, and IEEE conference papers.",
      externalUrl: "https://www.ieee.org",
    },
    {
      name: "ASME Kenyatta University Student Section",
      slug: "asme-ku",
      category: "Technical Chapters",
      isPlatformOwner: false,
      description:
        "American Society of Mechanical Engineers collegiate branch fostering mechanical design, thermal systems, and automation.",
      externalUrl: "https://www.asme.org",
    },
    {
      name: "KU Society of Automotive Engineers (SAE)",
      slug: "ku-sae",
      category: "Engineering Competition",
      isPlatformOwner: false,
      description:
        "Student-led design and fabrication of competition race vehicles, go-karts, and clean mobility innovations.",
    },
    {
      name: "Women in Engineering (WIE-KU)",
      slug: "wie-ku",
      category: "Affinity Groups",
      isPlatformOwner: false,
      description:
        "Dedicated to inspiring, empowering, and mentoring female engineers across all engineering disciplines at Kenyatta University.",
    },
    {
      name: "KU Robotics & AI Club",
      slug: "ku-robotics",
      category: "Innovation & Labs",
      isPlatformOwner: false,
      description:
        "Hands-on makerspace community building autonomous mobile robots, micro-controllers, IoT sensors, and machine vision systems.",
    },
  ];

  let esaClubId: number | null = null;

  for (const club of clubsData) {
    const existing = await db.query.clubs.findFirst({
      where: eq(schema.clubs.slug, club.slug),
    });

    if (existing) {
      console.log(`  ✓ Club exists: ${club.name}`);
      if (club.slug === "esa") esaClubId = existing.id;
    } else {
      const [inserted] = await db.insert(schema.clubs).values(club).returning();
      console.log(`  + Created Club: ${inserted.name}`);
      if (club.slug === "esa") esaClubId = inserted.id;
    }
  }

  // 4. Seed November Flagship Event
  if (esaClubId) {
    const eventTitle = "ESA Annual Engineering Summit & Freshmen Welcome 2026";
    const existingEvent = await db.query.events.findFirst({
      where: eq(schema.events.title, eventTitle),
    });

    if (!existingEvent) {
      const startDate = new Date("2026-11-14T09:00:00+03:00");
      const endDate = new Date("2026-11-14T17:00:00+03:00");

      await db.insert(schema.events).values({
        clubId: esaClubId,
        title: eventTitle,
        description:
          "The premier annual engineering convention of Kenyatta University! Bringing together student innovators, faculty deans, leading corporate engineering partners, and alumni. Featuring keynote industrial addresses, hands-on chapter project exhibitions, innovation challenges, and the official welcoming ceremony for the incoming 2026 Freshmen Class.",
        location: "Engineering Complex & 8-4-4 Amphitheatre, KU Main Campus",
        startAt: startDate,
        endAt: endDate,
        publishedAt: new Date(),
        isFeatured: true,
        registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc-esa-summit-2026/viewform",
      });
      console.log(`  + Created Flagship Event: ${eventTitle}`);
    } else {
      console.log(`  ✓ Flagship Event exists: ${eventTitle}`);
    }
  }

  console.log("✅ Seed completed successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
