import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { AdminConsole } from "@/components/admin/AdminConsole";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isEsaAdmin(user)) redirect("/");

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={true} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge-pill !text-xs !bg-neutral-800 !text-white !border-neutral-700">
              Administrative Control
            </span>
            <span className="text-xs text-neutral-400">/</span>
            <Link href="/admin/badges" className="text-xs font-semibold text-accent hover:underline">
              Badge Verification Queue →
            </Link>
            <span className="text-neutral-300">·</span>
            <Link href="/admin/resources" className="text-xs font-semibold text-accent hover:underline">
              Resource Moderation →
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">Admin Management Console</h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">
            Configure academic departments, student cohorts, technical chapters, and role authorizations.
          </p>
        </header>

        <AdminConsole />
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
