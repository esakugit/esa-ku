import { NextResponse } from "next/server";
import { db, users } from "@esa/db";
import { ilike } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

/** ESA-admin-only lookup used when assigning class reps / club admins. */
export async function GET(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const rows = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role })
    .from(users)
    .where(ilike(users.email, `%${q}%`))
    .limit(10);
  return NextResponse.json(rows);
}
