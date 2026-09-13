import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, cohorts } from "@esa/db";
import { eq } from "drizzle-orm";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import { isEsaAdmin } from "@/lib/roles";
import { TimetableView } from "@/components/TimetableView";

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.cohortId) {
    return (
      <div className="md:flex">
        <SidebarNav showAdmin={isEsaAdmin(user)} />
        <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:max-w-3xl md:px-10 md:py-10 md:pb-10 lg:max-w-4xl md:ml-56">
        <h1 className="mb-4 text-2xl font-bold text-ink">Timetable</h1>
        <div className="card p-5">
          <p className="text-sm text-neutral-600">
            Add your department and intake year to see your class timetable.
          </p>
          <Link href="/complete-profile" className="btn-primary mt-4 inline-flex">
            Complete profile
          </Link>
        </div>
        <BottomNav />
        </main>
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
    <div className="md:flex">
      <SidebarNav showAdmin={isEsaAdmin(user)} />
      <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:max-w-3xl md:px-10 md:py-10 md:pb-10 lg:max-w-4xl md:ml-56">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {ownCohort?.department?.name}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-ink">Timetable</h1>
      </header>

      <TimetableView
        ownCohortId={user.cohortId}
        ownCohortLabel={ownCohort?.label ?? "Your class"}
        hasActiveBadge={user.hasActiveBadge}
        canEditOwnCohort={canEditOwnCohort}
        ownDepartmentId={user.departmentId as number}
      />

      <BottomNav />
      </main>
    </div>
  );
}
