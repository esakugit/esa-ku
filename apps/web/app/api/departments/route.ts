import { NextResponse } from "next/server";
import { z } from "zod";
import { db, departments } from "@esa/db";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

/** Public — the signup form and every filter picker needs this list without auth. */
export async function GET() {
  const rows = await db.select().from(departments).orderBy(departments.name);
  return NextResponse.json(rows);
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(1).max(20),
});

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const [row] = await db
      .insert(departments)
      .values({ name: parsed.data.name, code: parsed.data.code.toUpperCase() })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "A department with that code already exists." },
      { status: 409 },
    );
  }
}
