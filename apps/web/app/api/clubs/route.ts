import { NextResponse } from "next/server";
import { z } from "zod";
import { db, clubs } from "@esa/db";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Public directory — every club shows here regardless of Badge status (spec §06). */
export async function GET() {
  const rows = await db.query.clubs.findMany({ orderBy: (c, { asc }) => asc(c.name) });
  return NextResponse.json(rows);
}

const createSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  category: z.string().max(80).optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
  logoBlobUrl: z.string().optional(),
  isPlatformOwner: z.boolean().optional(),
});

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let n = 1;
  while (await db.query.clubs.findFirst({ where: (c, { eq }) => eq(c.slug, slug) })) {
    slug = `${baseSlug}-${++n}`;
  }

  const [row] = await db
    .insert(clubs)
    .values({
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      externalUrl: parsed.data.externalUrl || null,
      logoBlobUrl: parsed.data.logoBlobUrl || null,
      isPlatformOwner: parsed.data.isPlatformOwner ?? false,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
