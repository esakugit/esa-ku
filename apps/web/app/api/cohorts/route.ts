import { NextResponse } from "next/server";
import { db, cohorts } from "@esa/db";
import { eq, desc } from "drizzle-orm";

/** Public — used by the timetable's cross-department cohort picker. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const rows = departmentId
    ? await db.select().from(cohorts).where(eq(cohorts.departmentId, Number(departmentId))).orderBy(desc(cohorts.entryYear))
    : await db.select().from(cohorts).orderBy(desc(cohorts.entryYear));
  return NextResponse.json(rows);
}
