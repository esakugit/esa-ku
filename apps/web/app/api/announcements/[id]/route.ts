import { NextResponse } from "next/server";
import { z } from "zod";
import { db, announcements } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

const patchSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  content: z.string().min(2).max(10000).optional(),
  category: z.string().min(1).max(80).optional(),
  priority: z.enum(["normal", "urgent"]).optional(),
  pinned: z.boolean().optional(),
  actionUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.query.announcements.findFirst({
    where: eq(announcements.id, Number(id)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(announcements)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.pinned !== undefined ? { pinned: parsed.data.pinned } : {}),
      ...(parsed.data.actionUrl !== undefined ? { actionUrl: parsed.data.actionUrl || null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, Number(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;

  await db.delete(announcements).where(eq(announcements.id, Number(id)));
  return NextResponse.json({ ok: true });
}
