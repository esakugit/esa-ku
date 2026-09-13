import { NextResponse } from "next/server";
import { z } from "zod";
import { db, badges } from "@esa/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { requireApiUser, isResponse } from "@/lib/api";
import { isEsaAdmin } from "@/lib/roles";

function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1; // Aug–Jul cycle
  return `${y}/${y + 1}`;
}

/** ESA admins see the verification queue; everyone else sees their own history. */
export async function GET() {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  if (isEsaAdmin(user)) {
    const rows = await db.query.badges.findMany({
      where: eq(badges.status, "pending_verification"),
      orderBy: [desc(badges.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            regNo: true,
            photoBlobUrl: true,
            departmentId: true,
            cohortId: true,
            role: true,
          },
        },
      },
    });
    return NextResponse.json(rows);
  }

  const rows = await db.query.badges.findMany({
    where: eq(badges.userId, user.id),
    orderBy: [desc(badges.createdAt)],
  });
  return NextResponse.json(rows);
}

const applySchema = z.object({
  paymentReference: z.string().min(4).max(40),
});

/** Student pastes their M-Pesa confirmation code (spec §04) — an admin verifies it manually. */
export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const parsed = applySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existingPending = await db.query.badges.findFirst({
    where: and(eq(badges.userId, user.id), eq(badges.status, "pending_verification")),
  });
  if (existingPending) {
    return NextResponse.json(
      { error: "You already have a Badge application awaiting verification." },
      { status: 409 },
    );
  }

  const [row] = await db
    .insert(badges)
    .values({
      userId: user.id,
      paymentReference: parsed.data.paymentReference.trim().toUpperCase(),
      academicYear: currentAcademicYear(),
      status: "pending_verification",
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
