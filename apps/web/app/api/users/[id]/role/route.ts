import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users, cohorts } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

const schema = z.object({
  role: z.enum(["student", "class_rep", "club_admin", "esa_admin"]),
  cohortId: z.number().int().positive().optional(), // required when role = class_rep
});

/** ESA-admin-only role assignment (spec §03) — super_admin is never set this way. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;
  const userId = Number(id);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "super_admin") {
    return NextResponse.json({ error: "Can't change a Super Admin's role." }, { status: 400 });
  }

  if (parsed.data.role === "class_rep") {
    const cohortId = parsed.data.cohortId ?? target.cohortId;
    if (!cohortId) {
      return NextResponse.json(
        { error: "This student has no cohort set yet — they must complete their profile first." },
        { status: 400 },
      );
    }
    const cohort = await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId) });
    if (!cohort) return NextResponse.json({ error: "Unknown cohort." }, { status: 400 });
    await db.update(users).set({ role: "class_rep", cohortId }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({ role: parsed.data.role }).where(eq(users.id, userId));
  }

  return NextResponse.json({ ok: true });
}
