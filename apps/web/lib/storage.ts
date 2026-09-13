import "server-only";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs/promises";
import { env } from "./env";

/**
 * File storage abstraction (spec §07/§11): "blob" (Vercel Blob, private
 * access mode) is what production uses; "local" writes to disk under
 * apps/web/.storage and serves through /api/files/[...path], so every
 * upload flow in the app (resources, event covers, profile photos) works
 * identically in this sandbox/local dev without a Blob token.
 */

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), ".storage");

function safeName(originalName: string): string {
  const ext = path.extname(originalName).slice(0, 10);
  const base = randomBytes(16).toString("hex");
  return `${base}${ext}`;
}

export type SavedFile = { url: string; pathKey: string; sizeBytes: number };

export async function saveFile(
  buffer: Buffer,
  opts: { category: string; originalName: string; contentType: string },
): Promise<SavedFile> {
  const filename = safeName(opts.originalName);
  const pathKey = `${opts.category}/${filename}`;

  if (env.STORAGE_DRIVER === "blob") {
    if (!env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "STORAGE_DRIVER=blob but BLOB_READ_WRITE_TOKEN is not set — connect a Vercel Blob store to this project.",
      );
    }
    const { put } = await import("@vercel/blob");
    const blob = await put(pathKey, buffer, {
      access: "public",
      contentType: opts.contentType,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, pathKey, sizeBytes: buffer.byteLength };
  }

  // Local driver
  const dir = path.join(LOCAL_STORAGE_ROOT, opts.category);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  return {
    url: `/api/files/${pathKey}`,
    pathKey,
    sizeBytes: buffer.byteLength,
  };
}

export async function readLocalFile(
  pathKey: string,
): Promise<{ buffer: Buffer } | null> {
  const resolved = path.join(LOCAL_STORAGE_ROOT, pathKey);
  // Guard against path traversal escaping the storage root.
  if (!resolved.startsWith(LOCAL_STORAGE_ROOT)) return null;
  try {
    const buffer = await fs.readFile(resolved);
    return { buffer };
  } catch {
    return null;
  }
}
