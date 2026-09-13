import { NextResponse } from "next/server";
import { readLocalFile } from "@/lib/storage";

const EXT_TO_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Serves files saved by the local storage driver (spec §11 — production
 * uses Vercel Blob's own public URLs instead, this route only exists for
 * local/self-hosted dev).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const pathKey = segments.join("/");
  const file = await readLocalFile(pathKey);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = pathKey.split(".").pop()?.toLowerCase() ?? "";
  const contentType = EXT_TO_TYPE[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
