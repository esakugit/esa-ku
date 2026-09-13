import { NextResponse } from "next/server";
import { z } from "zod";
import { db, legacyMembers } from "@esa/db";
import { isNull, desc } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";
import { generateUniqueBadgeNumber } from "@/lib/badgeNumber";

/** ESA admins only — the pre-platform membership roster (from physical/Canva cards). */
export async function GET(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const onlyUnmatched = searchParams.get("unmatched") === "true";

  const rows = await db.query.legacyMembers.findMany({
    where: onlyUnmatched ? isNull(legacyMembers.matchedUserId) : undefined,
    orderBy: [desc(legacyMembers.createdAt)],
    with: {
      matchedUser: { columns: { id: true, fullName: true, email: true } },
    },
  });
  return NextResponse.json(rows);
}

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  // Optional — if a card doesn't have one yet, or you're adding a member
  // without a printed card, leave it blank and we'll mint a fresh unique one.
  badgeNumber: z
    .string()
    .trim()
    // Cards printed before the platform existed aren't all 4 digits (some
    // are 5) — accept whatever's on the card; only freshly-generated numbers
    // (generateUniqueBadgeNumber) are held to exactly 4 digits going forward.
    .regex(/^ESA-\d{3,6}$/i, "Use the format ESA-1234")
    .transform((s) => s.toUpperCase())
    .optional(),
  regNo: z.string().trim().min(3).max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const badgeNumber = parsed.data.badgeNumber ?? (await generateUniqueBadgeNumber());

  try {
    const [row] = await db
      .insert(legacyMembers)
      .values({
        fullName: parsed.data.fullName,
        badgeNumber,
        regNo: parsed.data.regNo || null,
        notes: parsed.data.notes || null,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: `${badgeNumber} is already on the roster.` }, { status: 409 });
  }
}
