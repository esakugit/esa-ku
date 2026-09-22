import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, cohorts, departments } from "@esa/db";
import { eq } from "drizzle-orm";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { isEsaAdmin } from "@/lib/roles";
import { TimetableView } from "@/components/TimetableView";

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = isEsaAdmin(user);

  // If user has a cohort, use it. Otherwise, fetch the first cohort from the DB.
  let targetCohortId = user.cohortId;
  let ownCohort = null;

  if (targetCohortId) {
    ownCohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, targetCohortId),
      with: { department: true },
    });
  }

  // If no cohort found (admin or student without profile completed), pick the first available cohort
  if (!ownCohort) {
    ownCohort = await db.query.cohorts.findFirst({
      with: { department: true },
      orderBy: (c, { asc }) => asc(c.id),
    });
    targetCohortId = ownCohort?.id ?? null;
  }

  const canEdit =
    isAdmin ||
    (user.role === "class_rep" && user.hasActiveBadge && user.cohortId === targetCohortId);

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={isAdmin} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {ownCohort?.department?.name || "School of Engineering & Architecture"}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Departmental Timetable
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent border border-accent/20">
                Admin Editor Active
              </span>
            )}
          </div>
        </header>

        {!user.cohortId && !isAdmin && (
          <div className="card mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-flag/30 bg-flag-soft p-4 text-xs text-neutral-700">
            <span>
              You haven't set your department yet. Showing default timetable. Set your academic profile to view your personal schedule automatically.
            </span>
            <Link href="/complete-profile" className="btn-primary !text-xs whitespace-nowrap">
              Set Department
            </Link>
          </div>
        )}

        {targetCohortId && ownCohort ? (
          <TimetableView
            ownCohortId={targetCohortId}
            ownCohortLabel={ownCohort.label}
            hasActiveBadge={isAdmin || user.hasActiveBadge}
            canEditOwnCohort={canEdit}
            ownDepartmentId={ownCohort.departmentId}
            isAdmin={isAdmin}
          />
        ) : (
          <div className="card p-8 text-center text-sm text-neutral-500">
            No timetables or cohorts have been seeded yet. An admin can add departments and cohorts from the Admin Console.
          </div>
        )}
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
