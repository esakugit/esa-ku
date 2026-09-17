import { NextResponse } from "next/server";
import { db, resources } from "@esa/db";
import { requireApiUser, isResponse } from "@/lib/api";
import { saveFile } from "@/lib/storage";

const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5MB — strict Vercel Serverless request body limit

/** Browse the library — everyone (with an account) sees only approved uploads. */
export async function GET(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const courseId = searchParams.get("courseId");
  const type = searchParams.get("type");
  const academicYear = searchParams.get("academicYear");

  const rows = await db.query.resources.findMany({
    where: (r, { and, eq }) =>
      and(
        eq(r.status, "approved"),
        departmentId ? eq(r.departmentId, Number(departmentId)) : undefined,
        courseId ? eq(r.courseId, Number(courseId)) : undefined,
        type ? eq(r.type, type as "past_paper" | "notes" | "slides" | "other") : undefined,
        academicYear ? eq(r.academicYear, academicYear) : undefined,
      ),
    with: { course: true, department: true },
    orderBy: (r, { desc }) => desc(r.uploadedAt),
    limit: 100,
  });
  return NextResponse.json(rows);
}

/** Any verified student can contribute — an ESA admin approves before it's visible to others. */
export async function POST(req: Request) {
  const user = await requireApiUser();
  if (isResponse(user)) return user;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const title = form.get("title")?.toString().trim();
  const type = form.get("type")?.toString();
  const departmentId = Number(form.get("departmentId"));
  const courseId = form.get("courseId") ? Number(form.get("courseId")) : null;
  const academicYear = form.get("academicYear")?.toString() || null;
  const examType = form.get("examType")?.toString() || null;

  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!departmentId) return NextResponse.json({ error: "Department is required." }, { status: 400 });
  if (!type || !["past_paper", "notes", "slides", "other"].includes(type)) {
    return NextResponse.json({ error: "Invalid resource type." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (4.5MB max)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buffer, {
    category: "resources",
    originalName: file.name,
    contentType: file.type || "application/octet-stream",
  });

  const [row] = await db
    .insert(resources)
    .values({
      type: type as "past_paper" | "notes" | "slides" | "other",
      departmentId,
      courseId,
      academicYear,
      examType: examType as "cat_1" | "cat_2" | "main_exam" | "assignment" | null,
      title,
      blobUrl: saved.url,
      fileSizeBytes: saved.sizeBytes,
      uploadedBy: user.id,
      status: "pending",
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
