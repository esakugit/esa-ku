import { NextResponse } from "next/server";
import { z } from "zod";
import { db, subscriptions } from "@esa/db";
import { and, eq } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";

export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const rows = await db.query.subscriptions.findMany({ where: eq(subscriptions.userId, user.id) });
  return NextResponse.json(rows);
}

const schema = z.object({
  subjectType: z.enum(["club", "course", "cohort"]),
  subjectId: z.number().int().positive(),
});

/** Following is how a Badge holder opts into event/class reminders beyond their own cohort (spec §05). */
export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  if (!user.hasActiveBadge) {
    return NextResponse.json({ error: "An active Badge is required to follow for notifications." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await db
    .insert(subscriptions)
    .values({ userId: user.id, subjectType: parsed.data.subjectType, subjectId: parsed.data.subjectId })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const subjectType = searchParams.get("subjectType");
  const subjectId = Number(searchParams.get("subjectId"));
  if (!subjectType || !subjectId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  await db
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.subjectType, subjectType as "club" | "course" | "cohort"),
        eq(subscriptions.subjectId, subjectId),
      ),
    );
  return NextResponse.json({ ok: true });
}
