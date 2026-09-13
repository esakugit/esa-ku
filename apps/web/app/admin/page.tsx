import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { AdminConsole } from "@/components/admin/AdminConsole";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isEsaAdmin(user)) redirect("/");

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">ESA admin</p>
        <h1 className="mt-0.5 text-2xl font-bold text-ink">Admin console</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Departments, courses, clubs and roles. For Badge approvals go to{" "}
          <Link href="/admin/badges" className="text-accent underline">
            the Badge queue
          </Link>
          , for uploads go to{" "}
          <Link href="/admin/resources" className="text-accent underline">
            resource moderation
          </Link>
          .
        </p>
      </header>

      <AdminConsole />
      <BottomNav />
    </main>
  );
}
