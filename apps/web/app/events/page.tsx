import Link from "next/link";
import { db } from "@esa/db";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { BottomNav } from "@/components/BottomNav";
import { EventsFeedView } from "@/components/EventsFeedView";

export default async function EventsPage() {
  const user = await getCurrentUser().catch(() => null);

  let events: any[] = [];
  let clubs: any[] = [];

  try {
    events = await db.query.events.findMany({
      where: (e, { isNotNull }) => isNotNull(e.publishedAt),
      with: { club: true },
      orderBy: (e, { asc }) => asc(e.startAt),
    });

    clubs = await db.query.clubs.findMany({
      orderBy: (c, { asc }) => asc(c.name),
    });
  } catch (err) {
    console.error("[EventsPage] DB error:", err);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={user ? isEsaAdmin(user) : false} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge-pill !text-xs font-semibold">Campus Calendar</span>
            <span className="text-xs text-neutral-400">/</span>
            <span className="text-xs font-medium text-neutral-500">School of Engineering & Architecture</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Engineering Events, Dinners & Symposia
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Official upcoming dinners, guest lectures, design challenges, and networking sessions.
              </p>
            </div>

            {user && isEsaAdmin(user) && (
              <Link href="/admin" className="btn-secondary !text-xs font-semibold self-start sm:self-auto">
                Manage Events in Admin Console →
              </Link>
            )}
          </div>
        </header>

        <EventsFeedView initialEvents={events} clubs={clubs} />
      </main>

      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
