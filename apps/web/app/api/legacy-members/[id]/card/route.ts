import { NextResponse } from "next/server";
import { db, legacyMembers } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";
import { saveFile } from "@/lib/storage";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — a scanned card image, not a document

/** Attach (or replace) the scanned membership card image for a roster entry. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;
  const { id } = await params;

  const row = await db.query.legacyMembers.findFirst({ where: eq(legacyMembers.id, Number(id)) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A card image is required." }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Upload an image file (PNG/JPEG)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (8MB max)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buffer, {
    category: "legacy-cards",
    originalName: file.name,
    contentType: file.type,
  });

  const [updated] = await db
    .update(legacyMembers)
    .set({ cardImageUrl: saved.url })
    .where(eq(legacyMembers.id, row.id))
    .returning();

  return NextResponse.json(updated);
}
