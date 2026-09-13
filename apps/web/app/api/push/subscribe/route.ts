import { NextResponse } from "next/server";
import { z } from "zod";
import { db, pushSubscriptions } from "@esa/db";
import { requireApiUser, isResponse } from "@/lib/api";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

/** Push notifications are a Badge perk (spec §02) — enforced here, not just hidden in the UI. */
export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;
  if (!user.hasActiveBadge) {
    return NextResponse.json({ error: "An active Badge is required for notifications." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userId: user.id },
    });

  return NextResponse.json({ ok: true });
}
