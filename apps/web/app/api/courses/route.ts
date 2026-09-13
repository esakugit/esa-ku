import { NextResponse } from "next/server";
import { z } from "zod";
import { db, courses } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

/** Public — resource/timetable filters need this without auth. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const rows = departmentId
    ? await db.select().from(courses).where(eq(courses.departmentId, Number(departmentId))).orderBy(courses.code)
    : await db.select().from(courses).orderBy(courses.code);
  return NextResponse.json(rows);
}

const createSchema = z.object({
  departmentId: z.number().int().positive(),
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(160),
});

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [row] = await db.insert(courses).values(parsed.data).returning();
  return NextResponse.json(row, { status: 201 });
}
