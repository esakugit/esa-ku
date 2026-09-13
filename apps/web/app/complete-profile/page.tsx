import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, cohorts } from "@esa/db";
import { eq } from "drizzle-orm";
import { CompleteProfileForm } from "@/components/CompleteProfileForm";

export default async function CompleteProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cohort = user.cohortId
    ? await db.query.cohorts.findFirst({ where: eq(cohorts.id, user.cohortId) })
    : null;

  return (
    <CompleteProfileForm
      initialDepartmentId={user.departmentId}
      initialEntryYear={cohort?.entryYear ?? null}
      initialRegNo={user.regNo}
    />
  );
}
