import { NextResponse } from "next/server";
import { z } from "zod";
import { db, pushSubscriptions } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";

const schema = z.object({ endpoint: z.string().url() });

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, parsed.data.endpoint));
  return NextResponse.json({ ok: true });
}
