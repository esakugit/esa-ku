import { NextResponse } from "next/server";
import { db, resources } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

export async function GET() {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const rows = await db.query.resources.findMany({
    where: eq(resources.status, "pending"),
    with: { course: true, department: true, uploader: true },
    orderBy: (r, { asc }) => asc(r.uploadedAt),
  });
  return NextResponse.json(rows);
}
