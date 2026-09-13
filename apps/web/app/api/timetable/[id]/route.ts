import { NextResponse } from "next/server";
import { z } from "zod";
import { db, timetableEntries } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";
import { isClassRepFor } from "@/lib/roles";

const patchSchema = z.object({
  courseId: z.number().int().positive().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  venue: z.string().max(120).optional(),
  lecturerName: z.string().max(120).optional(),
  semesterLabel: z.string().max(40).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const entry = await db.query.timetableEntries.findFirst({ where: eq(timetableEntries.id, Number(id)) });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isClassRepFor(user, entry.cohortId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [row] = await db
    .update(timetableEntries)
    .set({
      ...(parsed.data.courseId ? { courseId: parsed.data.courseId } : {}),
      ...(parsed.data.dayOfWeek !== undefined ? { dayOfWeek: parsed.data.dayOfWeek } : {}),
      ...(parsed.data.startTime ? { startTime: parsed.data.startTime } : {}),
      ...(parsed.data.endTime ? { endTime: parsed.data.endTime } : {}),
      ...(parsed.data.venue !== undefined ? { venue: parsed.data.venue || null } : {}),
      ...(parsed.data.lecturerName !== undefined ? { lecturerName: parsed.data.lecturerName || null } : {}),
      ...(parsed.data.semesterLabel !== undefined ? { semesterLabel: parsed.data.semesterLabel || null } : {}),
    })
    .where(eq(timetableEntries.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const entry = await db.query.timetableEntries.findFirst({ where: eq(timetableEntries.id, Number(id)) });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isClassRepFor(user, entry.cohortId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(timetableEntries).where(eq(timetableEntries.id, Number(id)));
  return NextResponse.json({ ok: true });
}
