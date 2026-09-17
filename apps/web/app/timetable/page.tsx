import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, cohorts } from "@esa/db";
import { eq } from "drizzle-orm";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { isEsaAdmin } from "@/lib/roles";
import { TimetableView } from "@/components/TimetableView";

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.cohortId) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
        <InstitutionalHeader user={user} showAdmin={isEsaAdmin(user)} />
        <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Schedules</span>
            <h1 className="mt-1 text-2xl font-bold text-ink">Departmental Timetable</h1>
          </div>
          <div className="card p-6">
            <p className="text-sm text-neutral-600">
              Add your engineering department and intake year to see your official class timetable.
            </p>
            <Link href="/complete-profile" className="btn-primary mt-4 inline-flex">
              Complete Profile Setup
            </Link>
          </div>
        </main>
        <InstitutionalFooter />
        <BottomNav />
      </div>
    );
  }

  const ownCohort = await db.query.cohorts.findFirst({
    where: eq(cohorts.id, user.cohortId),
    with: { department: true },
  });
  const canEditOwnCohort =
    user.role === "esa_admin" ||
    user.role === "super_admin" ||
    (user.role === "class_rep" && user.hasActiveBadge);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={isEsaAdmin(user)} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {ownCohort?.department?.name || "School of Engineering & Architecture"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Departmental Timetable</h1>
        </header>

        <TimetableView
          ownCohortId={user.cohortId}
          ownCohortLabel={ownCohort?.label ?? "Your class"}
          hasActiveBadge={user.hasActiveBadge}
          canEditOwnCohort={canEditOwnCohort}
          ownDepartmentId={user.departmentId as number}
        />
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
