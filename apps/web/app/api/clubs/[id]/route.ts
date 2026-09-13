import { NextResponse } from "next/server";
import { z } from "zod";
import { db, clubs, clubAdmins } from "@esa/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isClubAdminFor } from "@/lib/roles";
import { requireApiUser, isResponse } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNumeric = /^\d+$/.test(id);
  const club = await db.query.clubs.findFirst({
    where: (c, { eq: eqOp, or }) => (isNumeric ? or(eqOp(c.id, Number(id)), eqOp(c.slug, id)) : eqOp(c.slug, id)),
    with: {
      admins: {
        with: {
          user: {
            columns: { id: true, fullName: true, email: true, photoBlobUrl: true },
          },
        },
      },
    },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(club);
}

const patchSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(80).optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { id } = await params;
  const clubId = Number(id);
  const allowed = await isClubAdminFor(user, clubId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [row] = await db
    .update(clubs)
    .set({
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category || null } : {}),
      ...(parsed.data.externalUrl !== undefined ? { externalUrl: parsed.data.externalUrl || null } : {}),
    })
    .where(eq(clubs.id, clubId))
    .returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await params;
  const clubId = Number(id);
  const allowed = await isClubAdminFor(user, clubId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.delete(clubAdmins).where(eq(clubAdmins.clubId, clubId));
  await db.delete(clubs).where(eq(clubs.id, clubId));
  return NextResponse.json({ ok: true });
}
