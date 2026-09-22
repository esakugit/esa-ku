import { NextResponse } from "next/server";
import { z } from "zod";
import { db, events } from "@esa/db";
import { eq, gte, desc, asc } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";
import { isClubAdminFor } from "@/lib/roles";

/** Public — the events feed is free data for everyone (spec §02/§06). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");
  const scope = searchParams.get("scope") ?? "upcoming"; // "upcoming" | "all"

  const rows = await db.query.events.findMany({
    where: (e, { and, eq: eqOp, gte: gteOp, isNotNull }) =>
      and(
        isNotNull(e.publishedAt),
        clubId ? eqOp(e.clubId, Number(clubId)) : undefined,
        scope === "upcoming" ? gteOp(e.startAt, new Date(Date.now() - 1000 * 60 * 60 * 6)) : undefined,
      ),
    orderBy: (e, { asc: ascOp }) => ascOp(e.startAt),
    with: { club: true },
    limit: 50,
  });
  return NextResponse.json(rows);
}

const createSchema = z.object({
  clubId: z.number().int().positive(),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  location: z.string().max(200).optional(),
  startAt: z.string().datetime().or(z.string().min(1)),
  endAt: z.string().datetime().or(z.string().min(1)).optional(),
  coverImageBlobUrl: z.string().max(1000).optional().or(z.literal("")),
  registrationUrl: z.string().max(1000).optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const allowed = await isClubAdminFor(user, parsed.data.clubId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Only that club's committee (with an active Badge) can post events." },
      { status: 403 },
    );
  }

  const [row] = await db
    .insert(events)
    .values({
      clubId: parsed.data.clubId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      coverImageBlobUrl: parsed.data.coverImageBlobUrl || null,
      registrationUrl: parsed.data.registrationUrl || null,
      isFeatured: Boolean(parsed.data.isFeatured),
      createdBy: user.id,
      publishedAt: new Date(),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
