import { NextResponse } from "next/server";
import { z } from "zod";
import { db, events } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";
import { isClubAdminFor } from "@/lib/roles";

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(4000).optional(),
  location: z.string().max(200).optional(),
  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const event = await db.query.events.findFirst({ where: eq(events.id, Number(id)) });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await isClubAdminFor(user, event.clubId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [row] = await db
    .update(events)
    .set({
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}),
      ...(parsed.data.location !== undefined ? { location: parsed.data.location || null } : {}),
      ...(parsed.data.startAt ? { startAt: new Date(parsed.data.startAt) } : {}),
      ...(parsed.data.endAt ? { endAt: new Date(parsed.data.endAt) } : {}),
    })
    .where(eq(events.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const event = await db.query.events.findFirst({ where: eq(events.id, Number(id)) });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await isClubAdminFor(user, event.clubId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(events).where(eq(events.id, Number(id)));
  return NextResponse.json({ ok: true });
}
