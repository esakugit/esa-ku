import { NextResponse } from "next/server";
import { z } from "zod";
import { db, platformSettings } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

const DEFAULT_HERO = {
  heroTitle: "Advancing Engineering Excellence, Innovation & Technical Leadership",
  heroSubtitle:
    "The official academic and professional society representing Kenyatta University engineering students across Civil, Electrical, Mechanical, Agricultural, and Aerospace disciplines.",
  heroEyebrow: "Kenyatta University · School of Engineering & Architecture",
  heroImageUrl: "/hero-event.svg",
  heroBadgeText: "Official ESA Student Society",
  announcementNotice: "",
};

export async function GET() {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, "hero"),
  });

  if (!row) {
    return NextResponse.json(DEFAULT_HERO);
  }

  try {
    const parsed = JSON.parse(row.value);
    return NextResponse.json({ ...DEFAULT_HERO, ...parsed });
  } catch {
    return NextResponse.json(DEFAULT_HERO);
  }
}

const updateSchema = z.object({
  heroTitle: z.string().min(2).max(500),
  heroSubtitle: z.string().min(2).max(2000),
  heroEyebrow: z.string().min(2).max(200),
  heroImageUrl: z.string().min(1).max(2000),
  heroBadgeText: z.string().max(200).optional(),
  announcementNotice: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const valueStr = JSON.stringify(parsed.data);

  const existing = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, "hero"),
  });

  if (existing) {
    await db
      .update(platformSettings)
      .set({
        value: valueStr,
        updatedBy: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.key, "hero"));
  } else {
    await db.insert(platformSettings).values({
      key: "hero",
      value: valueStr,
      updatedBy: admin.id,
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true, settings: parsed.data });
}
