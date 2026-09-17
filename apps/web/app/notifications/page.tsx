import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { NotificationList } from "@/components/NotificationList";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={isEsaAdmin(user)} />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Communications</span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Official Notices & Announcements
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">
            Timetable alterations, university circulars, chapter event updates, and academic notifications.
          </p>
        </header>

        {!user.hasActiveBadge && (
          <div className="card mb-6 p-5 border-flag/30 bg-flag-soft text-xs text-neutral-700 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-flag">Automated Class Reminders Require Badge</p>
              <p className="mt-0.5 text-neutral-600">
                You will receive instant push notifications and timetable alerts once your ESA Badge is activated.
              </p>
            </div>
            <Link href="/profile" className="lock-chip whitespace-nowrap !text-xs">
              Activate Badge →
            </Link>
          </div>
        )}

        <NotificationList />
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
