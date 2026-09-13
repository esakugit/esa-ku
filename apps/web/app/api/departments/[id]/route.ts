import { NextResponse } from "next/server";
import { z } from "zod";
import { db, departments } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  code: z.string().min(1).max(20).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [row] = await db
    .update(departments)
    .set({
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.code ? { code: parsed.data.code.toUpperCase() } : {}),
    })
    .where(eq(departments.id, Number(id)))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const { id } = await params;
  await db.delete(departments).where(eq(departments.id, Number(id)));
  return NextResponse.json({ ok: true });
}
