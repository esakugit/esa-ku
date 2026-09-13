import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import { ResourcesBrowser } from "@/components/ResourcesBrowser";

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="md:flex">
      <SidebarNav showAdmin={isEsaAdmin(user)} />
      <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:max-w-3xl md:px-10 md:py-10 md:pb-10 lg:max-w-4xl md:ml-56">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Library</p>
        <h1 className="mt-0.5 text-2xl font-bold text-ink">Past papers & resources</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Free for everyone, organized by department, course and year. Upload something to help
          the next cohort.
        </p>
      </header>

      <ResourcesBrowser defaultDepartmentId={user.departmentId} />
      <BottomNav />
      </main>
    </div>
  );
}
