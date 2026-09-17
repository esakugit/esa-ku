import { NextResponse } from "next/server";
import { z } from "zod";
import { db, events } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";
import { isClubAdminFor, isEsaAdmin } from "@/lib/roles";

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(4000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional().nullable(),
  coverImageBlobUrl: z.string().url().optional().nullable().or(z.literal("")),
  registrationUrl: z.string().url().optional().nullable().or(z.literal("")),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const event = await db.query.events.findFirst({ where: eq(events.id, Number(id)) });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = isEsaAdmin(user) || (await isClubAdminFor(user, event.clubId));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const [row] = await db
    .update(events)
    .set({
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}),
      ...(parsed.data.location !== undefined ? { location: parsed.data.location || null } : {}),
      ...(parsed.data.startAt ? { startAt: new Date(parsed.data.startAt) } : {}),
      ...(parsed.data.endAt !== undefined ? { endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null } : {}),
      ...(parsed.data.coverImageBlobUrl !== undefined ? { coverImageBlobUrl: parsed.data.coverImageBlobUrl || null } : {}),
      ...(parsed.data.registrationUrl !== undefined ? { registrationUrl: parsed.data.registrationUrl || null } : {}),
      ...(parsed.data.isFeatured !== undefined ? { isFeatured: parsed.data.isFeatured } : {}),
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

  const allowed = isEsaAdmin(user) || (await isClubAdminFor(user, event.clubId));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(events).where(eq(events.id, Number(id)));
  return NextResponse.json({ ok: true });
}
