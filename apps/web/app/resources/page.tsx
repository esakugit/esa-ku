import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { ResourcesBrowser } from "@/components/ResourcesBrowser";

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={isEsaAdmin(user)} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Resources</span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Past Papers & Course Materials
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Organized by department, course code, and academic year for KU engineering students.
          </p>
        </header>

        <ResourcesBrowser defaultDepartmentId={user.departmentId} />
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
