import { NextResponse } from "next/server";
import { z } from "zod";
import { db, resources } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

const schema = z.object({ decision: z.enum(["approve", "reject"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.decision === "approve") {
    await db.update(resources).set({ status: "approved" }).where(eq(resources.id, Number(id)));
  } else {
    await db.delete(resources).where(eq(resources.id, Number(id)));
  }
  return NextResponse.json({ ok: true });
}
