import { NextResponse } from "next/server";
import { z } from "zod";
import { db, courses } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

const patchSchema = z.object({
  code: z.string().min(2).max(20).optional(),
  name: z.string().min(2).max(160).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [row] = await db.update(courses).set(parsed.data).where(eq(courses.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;
  await db.delete(courses).where(eq(courses.id, Number(id)));
  return NextResponse.json({ ok: true });
}
