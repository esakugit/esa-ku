import { NextResponse } from "next/server";
import { db, legacyMembers } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

/** Remove a roster entry added by mistake (e.g. a mis-typed card). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;

  const row = await db.query.legacyMembers.findFirst({ where: eq(legacyMembers.id, Number(id)) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.matchedUserId) {
    return NextResponse.json(
      { error: "This entry is already linked to an account — can't delete it." },
      { status: 409 },
    );
  }

  await db.delete(legacyMembers).where(eq(legacyMembers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
