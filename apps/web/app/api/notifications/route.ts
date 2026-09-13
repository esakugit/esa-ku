import { NextResponse } from "next/server";
import { db, notificationsLog } from "@esa/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";

export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const rows = await db.query.notificationsLog.findMany({
    where: eq(notificationsLog.userId, user.id),
    orderBy: [desc(notificationsLog.createdAt)],
    limit: 100,
  });
  return NextResponse.json(rows);
}

/** Mark all (or one, via ?id=) of the current user's notifications read. */
export async function PATCH(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  await db
    .update(notificationsLog)
    .set({ readAt: new Date() })
    .where(
      id
        ? and(eq(notificationsLog.userId, user.id), eq(notificationsLog.id, Number(id)))
        : and(eq(notificationsLog.userId, user.id), isNull(notificationsLog.readAt)),
    );
  return NextResponse.json({ ok: true });
}
