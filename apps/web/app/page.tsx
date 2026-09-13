import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { db } from "@esa/db";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
import { NotificationBell } from "@/components/NotificationBell";

export default async function HomePage() {
  const user = await getCurrentUser();

  const events = await db.query.events.findMany({
    where: (e, { isNotNull, gte, and }) =>
      and(isNotNull(e.publishedAt), gte(e.startAt, new Date(Date.now() - 1000 * 60 * 60 * 6))),
    orderBy: (e, { asc }) => asc(e.startAt),
    with: { club: true },
    limit: 8,
  });

  return (
    <div className="md:flex">
      {user && <SidebarNav showAdmin={isEsaAdmin(user)} />}
      <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:max-w-3xl md:px-10 md:py-10 md:pb-10 lg:max-w-4xl md:ml-56">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.png" alt="ESA-KU" width={44} height={26} priority />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              ESA Campus Platform
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-ink">
              {user ? `Welcome back, ${user.fullName.split(" ")[0]}` : "Home"}
            </h1>
          </div>
        </div>
        {user && <NotificationBell />}
      </header>

      {!user && (
        <div className="card mb-6 p-5">
          <p className="mb-4 text-sm text-neutral-600">
            Sign in to see your timetable and follow ESA events.
          </p>
          <div className="flex gap-3">
            <Link href="/login" className="btn-primary">
              Log in
            </Link>
            <Link href="/sign-up" className="btn-secondary">
              Create account
            </Link>
          </div>
        </div>
      )}

      {user && !user.profileComplete && (
        <div className="card mb-6 flex items-center justify-between gap-4 p-5">
          <p className="text-sm text-ink">Finish setting up your profile to unlock your class timetable.</p>
          <Link href="/complete-profile" className="btn-primary whitespace-nowrap">
            Set up
          </Link>
        </div>
      )}

      {user && !user.hasActiveBadge && (
        <div className="card mb-6 flex items-center justify-between gap-4 border-flag/30 bg-flag-soft p-5">
          <div>
            <p className="text-sm font-semibold text-ink">Get your ESA Badge</p>
            <p className="mt-1 text-sm text-neutral-600">
              Unlock class reminders, cross-department timetables, and a digital membership card.
            </p>
          </div>
          <Link href="/profile" className="lock-chip whitespace-nowrap">
            Get Badge
          </Link>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">Upcoming events</h2>
          <Link href="/clubs" className="text-xs font-medium text-accent">
            Browse clubs →
          </Link>
        </div>
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{e.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{e.club.name}</p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  {new Date(e.startAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {new Date(e.startAt).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" })}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </li>
          ))}
          {events.length === 0 && (
            <div className="card p-5">
              <p className="text-sm text-neutral-500">
                No upcoming events yet — check back soon, or browse the clubs directory.
              </p>
            </div>
          )}
        </ul>
      </section>

      {user && <BottomNav />}
      </main>
    </div>
  );
}
