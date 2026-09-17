import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { db } from "@esa/db";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { BottomNav } from "@/components/BottomNav";

export default async function HomePage() {
  const user = await getCurrentUser();

  const events = await db.query.events.findMany({
    where: (e, { isNotNull, gte, and }) =>
      and(isNotNull(e.publishedAt), gte(e.startAt, new Date(Date.now() - 1000 * 60 * 60 * 6))),
    orderBy: (e, { asc }) => asc(e.startAt),
    with: { club: true },
    limit: 6,
  });

  const featuredEvent =
    (await db.query.events.findFirst({
      where: (e, { and, isNotNull, eq }) => and(isNotNull(e.publishedAt), eq(e.isFeatured, true)),
      with: { club: true },
      orderBy: (e, { asc }) => asc(e.startAt),
    })) ?? events[0];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      {/* 1. Official Top Navigation Bar */}
      <InstitutionalHeader user={user} showAdmin={user ? isEsaAdmin(user) : false} />

      <main className="flex-1">
        {/* 2. Flagship Institutional Hero */}
        <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white">
          {/* Background schematic container */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity pointer-events-none"
            style={{ backgroundImage: "url('/hero-event.svg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-900/75 pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              {/* Clean institutional eyebrow — no box, no dot */}
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent-muted mb-3">
                Kenyatta University &middot; School of Engineering &amp; Architecture
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                Advancing Engineering Excellence, Innovation &amp; Technical Leadership
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-300">
                The official academic and professional society representing Kenyatta University engineering
                scholars across Civil, Electrical, Mechanical, Agricultural, and Aerospace disciplines.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/resources" className="btn-primary !px-5 !py-2.5 !text-sm shadow-md">
                  Access Academic Vault
                </Link>
                <Link
                  href="/timetable"
                  className="rounded-md border border-neutral-700 bg-neutral-900/80 px-5 py-2.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  View Timetables
                </Link>
                {!user ? (
                  <Link href="/sign-up" className="rounded-md px-4 py-2 text-sm font-semibold text-accent-muted hover:text-white transition-colors">
                    Become a Member →
                  </Link>
                ) : !user.hasActiveBadge ? (
                  <Link href="/profile" className="lock-chip !text-xs font-semibold">
                    Activate Digital Badge →
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Key Institutional Metrics Banner */}
            <div className="mt-14 grid grid-cols-2 gap-4 border-t border-neutral-800/80 pt-8 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold tracking-tight text-white">5</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-400">Engineering Disciplines</p>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-accent-muted">12+</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-400">Technical Chapters &amp; Clubs</p>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-brandgreen-muted">100%</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-400">Verified Past Exam Papers</p>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-white">ESA-KU</p>
                <p className="mt-0.5 text-xs font-medium text-neutral-400">Official Student Society</p>
              </div>
            </div>
          </div>
        </section>

        {/* Flagship November Event Spotlight */}
        {featuredEvent && (
          <section className="bg-gradient-to-r from-accent/10 via-neutral-100 to-accent-soft border-b border-neutral-200">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-accent/30 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
                        ★ Flagship Community Event
                      </span>
                      <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                        {featuredEvent.club.name}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                      {featuredEvent.title}
                    </h2>

                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {featuredEvent.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-700 pt-1">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {new Date(featuredEvent.startAt).toLocaleDateString("en-KE", {
                            weekday: "short",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {featuredEvent.location && (
                        <div className="flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{featuredEvent.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-none">
                    {featuredEvent.registrationUrl ? (
                      <a
                        href={featuredEvent.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary !px-6 !py-3 text-center !text-sm shadow-sm"
                      >
                        Register / RSVP Now →
                      </a>
                    ) : (
                      <Link
                        href={`/clubs/${featuredEvent.club.slug}`}
                        className="btn-primary !px-6 !py-3 text-center !text-sm shadow-sm"
                      >
                        View Event Details →
                      </Link>
                    )}
                    <Link
                      href="/sign-up"
                      className="rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      Join ESA Community
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Freshmen Welcome & Quickstart Ribbon */}
        <section className="bg-white border-b border-neutral-200 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg bg-neutral-50 p-4 border border-neutral-200">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
                  2026
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink">Welcome to KU Engineering, Freshmen!</h3>
                  <p className="text-xs text-neutral-500">
                    Get settled in: view your department timetables, past examination papers, and join your technical chapters.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/timetable" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors">
                  Class Timetable
                </Link>
                <Link href="/resources" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors">
                  Past Papers Vault
                </Link>
                <Link href="/clubs" className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors">
                  Clubs & Chapters
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Authenticated Student Quick Overview Widget (if logged in) */}
        {user && (
          <section className="bg-neutral-50 border-b border-neutral-200">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-ink">
                    Welcome back, {user.fullName}
                  </span>
                  {user.regNo && (
                    <span className="rounded bg-neutral-200 px-2 py-0.5 font-mono text-neutral-700">
                      {user.regNo}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user.hasActiveBadge ? (
                    <span className="inline-flex items-center gap-1.5 rounded bg-brandgreen-soft px-2.5 py-1 text-xs font-semibold text-brandgreen border border-brandgreen/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-brandgreen" />
                      Active Badge ({user.badgeNumber})
                    </span>
                  ) : (
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-1 rounded bg-flag-soft px-2.5 py-1 text-xs font-semibold text-flag border border-flag/30 hover:bg-flag-soft/80"
                    >
                      Complete Registration for Badge →
                    </Link>
                  )}
                  {!user.profileComplete && (
                    <Link
                      href="/complete-profile"
                      className="rounded bg-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-300"
                    >
                      Set Department & Cohort
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. Core Gateways (Academic Pillars) */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-accent">
              Academic & Technical Services
            </h2>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Essential Resources for Kenyatta University Engineers
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Gateway 1: Academic Vault */}
            <Link
              href="/resources"
              className="card group p-5 hover:border-accent hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                  Academic Vault
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Access peer-reviewed past examination papers, faculty lecture notes, and lab manuals organized by unit.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-semibold text-accent">
                Browse Repository →
              </span>
            </Link>

            {/* Gateway 2: Department Timetables */}
            <Link
              href="/timetable"
              className="card group p-5 hover:border-accent hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                  Class Timetables
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Verified weekly lecture times, lab sessions, and classroom room allocations across all 5 departments.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-semibold text-accent">
                View Schedule →
              </span>
            </Link>

            {/* Gateway 3: Chapters & Technical Clubs */}
            <Link
              href="/clubs"
              className="card group p-5 hover:border-accent hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                  Technical Chapters
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Affiliated professional bodies including IEEE-KU Student Branch, Robotics Society, and SAE Kenya.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-semibold text-accent">
                Explore Chapters →
              </span>
            </Link>

            {/* Gateway 4: Digital Membership Badge */}
            <Link
              href="/profile"
              className="card group p-5 hover:border-accent hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                  Membership & Badge
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Official verified digital membership card, voting accreditation, and technical conference access.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-semibold text-accent">
                Verify Credentials →
              </span>
            </Link>
          </div>
        </section>

        {/* 5. Upcoming Events & Technical Workshops Grid */}
        <section className="border-t border-neutral-200 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-accent">
                  Events & Technical Symposia
                </h2>
                <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                  Upcoming Engineering Workshops & Seminars
                </p>
              </div>
              <Link href="/clubs" className="text-xs font-semibold text-accent hover:underline">
                View all club events →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <article key={e.id} className="card overflow-hidden hover:border-neutral-300 transition-colors flex flex-col justify-between">
                  {e.coverImageBlobUrl && (
                    <div className="relative h-44 w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.coverImageBlobUrl}
                        alt={e.title}
                        className="h-full w-full object-cover"
                      />
                      {e.isFeatured && (
                        <span className="absolute top-2.5 left-2.5 rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          ★ Featured
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 mb-2">
                        <span className="font-semibold text-accent">{e.club.name}</span>
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          {new Date(e.startAt).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink leading-snug">{e.title}</h3>
                      {e.description && (
                        <p className="mt-2 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                          {e.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>
                          {new Date(e.startAt).toLocaleTimeString("en-KE", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {e.location && <span className="truncate max-w-[150px] font-medium">{e.location}</span>}
                      </div>

                      {e.registrationUrl && (
                        <a
                          href={e.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block w-full rounded bg-accent-soft px-3 py-1.5 text-center text-xs font-semibold text-accent hover:bg-accent hover:text-white transition-colors"
                        >
                          RSVP / Register →
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {events.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 card p-8 text-center">
                  <p className="text-sm font-semibold text-neutral-700">No scheduled technical events at this moment.</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Check back soon as student chapters publish technical schedules and hackathons.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 6. Academic Engineering Departments Directory */}
        <section className="border-t border-neutral-200 bg-neutral-50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent">
                School of Engineering & Architecture
              </h2>
              <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                Affiliated Academic Departments
              </p>
              <p className="mt-2 text-xs text-neutral-600">
                ESA proudly serves students enrolled in all EAC & EBK accredited engineering curricula.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5 text-center">
              <div className="card p-4 bg-white">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent text-xs font-bold">
                  EE
                </div>
                <h4 className="text-xs font-bold text-ink">Electrical & Electronic</h4>
                <p className="mt-1 text-[11px] text-neutral-500">Power, Telecom & Control</p>
              </div>
              <div className="card p-4 bg-white">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent text-xs font-bold">
                  ME
                </div>
                <h4 className="text-xs font-bold text-ink">Mechanical & Manufacturing</h4>
                <p className="mt-1 text-[11px] text-neutral-500">Thermodynamics & Design</p>
              </div>
              <div className="card p-4 bg-white">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent text-xs font-bold">
                  CE
                </div>
                <h4 className="text-xs font-bold text-ink">Civil & Structural</h4>
                <p className="mt-1 text-[11px] text-neutral-500">Structures & Geotechnics</p>
              </div>
              <div className="card p-4 bg-white">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent text-xs font-bold">
                  AE
                </div>
                <h4 className="text-xs font-bold text-ink">Aerospace Engineering</h4>
                <p className="mt-1 text-[11px] text-neutral-500">Avionics & Aerodynamics</p>
              </div>
              <div className="card p-4 bg-white">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent text-xs font-bold">
                  BE
                </div>
                <h4 className="text-xs font-bold text-ink">Agricultural & Biosystems</h4>
                <p className="mt-1 text-[11px] text-neutral-500">Bio-processes & Water</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Official Institutional Footer */}
      <InstitutionalFooter />

      {/* Mobile Bottom Navigation (for quick mobile touch access) */}
      <BottomNav />
    </div>
  );
}
