import { NextResponse } from "next/server";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";
import { saveFile } from "@/lib/storage";

const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5MB Vercel Serverless limit

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const category = (form.get("category") as string) || "hero";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (4.5MB max)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buffer, {
    category,
    originalName: file.name,
    contentType: file.type || "application/octet-stream",
  });

  return NextResponse.json({ url: saved.url, pathKey: saved.pathKey });
}
