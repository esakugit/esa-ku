import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users, cohorts, departments } from "@esa/db";
import { eq, and, ne } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";

/**
 * The single place a student finishes setting up their profile: department,
 * intake year, and registration number. Signup only collects identity +
 * credentials (see app/api/auth/signup/route.ts) — this is intentionally
 * the ONLY other place that asks for this information, so there's one
 * coherent onboarding path instead of two forms asking the same thing.
 */
const patchSchema = z.object({
  departmentId: z.number().int().positive(),
  entryYear: z.number().int().min(2015).max(new Date().getFullYear() + 1),
  regNo: z.string().trim().min(3).max(30),
});

export async function PATCH(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { departmentId, entryYear, regNo } = parsed.data;

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
  });
  if (!department) {
    return NextResponse.json({ error: "Unknown department." }, { status: 400 });
  }

  const regNoTaken = await db.query.users.findFirst({
    where: and(eq(users.regNo, regNo), ne(users.id, user.id)),
  });
  if (regNoTaken) {
    return NextResponse.json({ error: "That registration number is already linked to another account." }, { status: 409 });
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
    .set({ departmentId, cohortId: cohort.id, regNo, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
