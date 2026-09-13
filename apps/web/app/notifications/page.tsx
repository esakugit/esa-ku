import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import { NotificationList } from "@/components/NotificationList";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="md:flex">
      <SidebarNav showAdmin={isEsaAdmin(user)} />
      <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:max-w-3xl md:px-10 md:py-10 md:pb-10 lg:max-w-4xl md:ml-56">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Notifications</p>
        <h1 className="mt-0.5 text-2xl font-bold text-ink">What's new</h1>
      </header>

      {!user.hasActiveBadge && (
        <div className="card mb-6 p-4 text-sm text-neutral-600">
          You'll only receive reminders here once you have an active Badge — get yours from{" "}
          <a href="/profile" className="text-accent underline">
            your profile
          </a>
          .
        </div>
      )}

      <NotificationList />
      <BottomNav />
      </main>
    </div>
  );
}
