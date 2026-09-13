import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users, cohorts, departments } from "@esa/db";
import { eq, and } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";

/**
 * Lets a student complete (or change) their department/cohort after signup —
 * needed on a fresh install where the bootstrap admin signs up before any
 * department exists (see app/api/auth/signup/route.ts), and useful generally
 * for a student who mistyped their intake year.
 */
const patchSchema = z.object({
  departmentId: z.number().int().positive(),
  entryYear: z.number().int().min(2015).max(new Date().getFullYear() + 1),
});

export async function PATCH(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { departmentId, entryYear } = parsed.data;

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
  });
  if (!department) {
    return NextResponse.json({ error: "Unknown department." }, { status: 400 });
  }

  let cohort = await db.query.cohorts.findFirst({
    where: and(eq(cohorts.departmentId, departmentId), eq(cohorts.entryYear, entryYear)),
  });
  if (!cohort) {
    const [created] = await db
      .insert(cohorts)
      .values({
        departmentId,
        entryYear,
        label: `${department.name} · intake ${entryYear}`,
      })
      .returning();
    cohort = created;
  }

  await db
    .update(users)
    .set({ departmentId, cohortId: cohort.id, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
