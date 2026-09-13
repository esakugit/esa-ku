import { NextResponse } from "next/server";
import { z } from "zod";
import { db, clubAdmins, users } from "@esa/db";
import { and, eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

/**
 * Committee membership for a club (spec §06): being made a club_admin here
 * only grants in-platform posting powers once that person also holds an
 * active Badge — enforced by lib/roles.ts, not here.
 */
const addSchema = z.object({
  email: z.string().email(),
  level: z.enum(["owner", "editor"]).default("editor"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;
  const clubId = Number(id);

  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!target) return NextResponse.json({ error: "No account with that email." }, { status: 404 });

  await db
    .insert(clubAdmins)
    .values({ userId: target.id, clubId, level: parsed.data.level })
    .onConflictDoUpdate({
      target: [clubAdmins.userId, clubAdmins.clubId],
      set: { level: parsed.data.level },
    });

  if (target.role === "student") {
    await db.update(users).set({ role: "club_admin" }).where(eq(users.id, target.id));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;
  const clubId = Number(id);
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("userId"));
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await db.delete(clubAdmins).where(and(eq(clubAdmins.clubId, clubId), eq(clubAdmins.userId, userId)));
  return NextResponse.json({ ok: true });
}
