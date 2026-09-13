import { NextResponse } from "next/server";
import { z } from "zod";
import { db, timetableEntries, cohorts } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";
import { isClassRepFor } from "@/lib/roles";

/**
 * A student's own cohort timetable is free for everyone (spec §02); browsing
 * any OTHER cohort's timetable is the cross-department Badge perk.
 */
export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const cohortId = Number(searchParams.get("cohortId"));
  if (!cohortId) return NextResponse.json({ error: "cohortId required" }, { status: 400 });

  const isOwnCohort = user.cohortId === cohortId;
  if (!isOwnCohort && !user.hasActiveBadge) {
    return NextResponse.json(
      { error: "An active Badge is required to view another cohort's timetable." },
      { status: 403 },
    );
  }

  const rows = await db.query.timetableEntries.findMany({
    where: eq(timetableEntries.cohortId, cohortId),
    with: { course: true },
    orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.startTime)],
  });
  return NextResponse.json(rows);
}

const createSchema = z.object({
  cohortId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  venue: z.string().max(120).optional(),
  lecturerName: z.string().max(120).optional(),
  semesterLabel: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  if (!isClassRepFor(user, parsed.data.cohortId)) {
    return NextResponse.json(
      { error: "Only that cohort's class rep (with an active Badge) or an ESA admin can edit this timetable." },
      { status: 403 },
    );
  }

  const cohort = await db.query.cohorts.findFirst({ where: eq(cohorts.id, parsed.data.cohortId) });
  if (!cohort) return NextResponse.json({ error: "Unknown cohort." }, { status: 400 });

  const [row] = await db
    .insert(timetableEntries)
    .values({
      cohortId: parsed.data.cohortId,
      courseId: parsed.data.courseId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      venue: parsed.data.venue || null,
      lecturerName: parsed.data.lecturerName || null,
      semesterLabel: parsed.data.semesterLabel || null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
