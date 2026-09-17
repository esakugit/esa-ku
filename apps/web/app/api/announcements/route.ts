import { NextResponse } from "next/server";
import { z } from "zod";
import { db, announcements } from "@esa/db";
import { desc } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

export async function GET() {
  const rows = await db.query.announcements.findMany({
    orderBy: [desc(announcements.pinned), desc(announcements.publishedAt)],
    with: { author: { columns: { id: true, fullName: true, role: true } } },
    limit: 50,
  });
  return NextResponse.json(rows);
}

const createSchema = z.object({
  title: z.string().min(2).max(255),
  content: z.string().min(2).max(10000),
  category: z.string().min(1).max(80).default("General"),
  priority: z.enum(["normal", "urgent"]).default("normal"),
  pinned: z.boolean().default(false),
  actionUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(announcements)
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category,
      priority: parsed.data.priority,
      pinned: parsed.data.pinned,
      actionUrl: parsed.data.actionUrl || null,
      authorId: admin.id,
      publishedAt: new Date(),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
