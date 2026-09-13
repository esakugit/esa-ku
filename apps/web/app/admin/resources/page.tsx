import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { ResourceModerationQueue } from "@/components/admin/ResourceModerationQueue";

export default async function AdminResourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isEsaAdmin(user)) redirect("/");

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">ESA admin</p>
        <h1 className="mt-0.5 text-2xl font-bold text-ink">Resource moderation</h1>
        <p className="mt-1 text-sm text-neutral-500">Review uploads before they appear in the library.</p>
      </header>

      <ResourceModerationQueue />
      <BottomNav />
    </main>
  );
}
