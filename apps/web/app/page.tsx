import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { db } from "@esa/db";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);

  // Defensive: if DB is unreachable, show page with defaults rather than 500
  // Using a broad type here because the `with: { club: true }` relation is
  // resolved at runtime — TypeScript can't infer it from the bare findMany signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let events: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let featuredEvent: any = undefined;
  let heroSettings: { heroTitle?: string; heroSubtitle?: string; heroEyebrow?: string; heroImageUrl?: string } | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pinnedAnnouncement: any = undefined;

  try {
    events = await db.query.events.findMany({
      where: (e, { isNotNull, gte, and }) =>
        and(isNotNull(e.publishedAt), gte(e.startAt, new Date(Date.now() - 1000 * 60 * 60 * 6))),
      orderBy: (e, { asc }) => asc(e.startAt),
      with: { club: true },
      limit: 6,
    });

    const featuredEventRow = await db.query.events.findFirst({
      where: (e, { and, isNotNull, eq }) => and(isNotNull(e.publishedAt), eq(e.isFeatured, true)),
      with: { club: true },
      orderBy: (e, { asc }) => asc(e.startAt),
    });
    featuredEvent = featuredEventRow ?? events[0];

    const heroSettingsRow = await db.query.platformSettings.findFirst({
      where: (s, { eq }) => eq(s.key, "hero"),
    });
    heroSettings = heroSettingsRow
      ? (JSON.parse(heroSettingsRow.value) as {
          heroTitle?: string;
          heroSubtitle?: string;
          heroEyebrow?: string;
          heroImageUrl?: string;
        })
      : null;

    pinnedAnnouncement = await db.query.announcements.findFirst({
      where: (a, { eq }) => eq(a.pinned, true),
      orderBy: (a, { desc }) => desc(a.publishedAt),
    });
  } catch (err) {
    console.error("[HomePage] DB query failed:", err);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      {/* 1. Official Top Navigation Bar */}
      <InstitutionalHeader user={user} showAdmin={user ? isEsaAdmin(user) : false} />

      {/* Pinned Official Notice Banner (if any) */}
      {pinnedAnnouncement && (
        <aside className="bg-accent text-white px-4 py-2 text-xs font-medium border-b border-accent-muted/40">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                📢 {pinnedAnnouncement.category}
              </span>
              <span className="font-semibold">{pinnedAnnouncement.title}:</span>
              <span className="text-white/90 line-clamp-1">{pinnedAnnouncement.content}</span>
            </div>
            {pinnedAnnouncement.actionUrl ? (
              <a
                href={pinnedAnnouncement.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-white text-accent px-2.5 py-1 text-[11px] font-bold hover:bg-neutral-100 transition-colors"
              >
                View Notice ↗
              </a>
            ) : (
              <Link href="/notifications" className="underline text-white/90 hover:text-white">
                View in Notices →
              </Link>
            )}
          </div>
        </aside>
      )}

      <main className="flex-1">
        {/* 2. Flagship Institutional Hero */}
        <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white">
          {/* Background schematic / engineering CAD canvas */}
          <div
            className="absolute inset-0 bg-cover bg-right lg:bg-center opacity-85 pointer-events-none"
            style={{ backgroundImage: `url('${heroSettings?.heroImageUrl || "/hero-event.svg"}')` }}
          />
          {/* Directional vignette: deep solid contrast behind typography on the left, reveals glowing schematics on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-neutral-950/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/30 pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              {/* Clean institutional eyebrow — no box, no dot */}
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent-muted mb-3">
                {heroSettings?.heroEyebrow || "Kenyatta University · School of Engineering & Architecture"}
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                {heroSettings?.heroTitle || "Advancing Engineering Excellence, Innovation & Technical Leadership"}
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-neutral-300">
                {heroSettings?.heroSubtitle ||
                  "The official academic and professional society representing Kenyatta University engineering students across Civil, Electrical, Mechanical, Agricultural, and Aerospace disciplines."}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/resources" className="btn-primary !px-5 !py-2.5 !text-sm shadow-md">
                  Browse Resources
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
                    Activate Membership Card →
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

        {/* Flagship November Event Spotlight with Poster */}
        {featuredEvent && (
          <section className="bg-gradient-to-r from-accent/5 via-white to-accent-soft/30 border-b border-neutral-200 py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-accent/25 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Event Poster / Flyer */}
                  {featuredEvent.coverImageBlobUrl ? (
                    <div className="w-full sm:w-72 lg:w-80 shrink-0 self-center lg:self-start">
                      <Link href="/events" className="group block overflow-hidden rounded-xl border border-neutral-200 shadow-md">
                        <img
                          src={featuredEvent.coverImageBlobUrl}
                          alt={featuredEvent.title}
                          className="w-full object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      </Link>
                      <p className="mt-2 text-center text-[11px] text-neutral-400">
                        Official Event Poster · Kenyatta University
                      </p>
                    </div>
                  ) : null}

                  {/* Event Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
                        ★ Flagship Community Event
                      </span>
                      <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        {featuredEvent.club.name}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                      {featuredEvent.title}
                    </h2>

                    {/* Theme Pill */}
                    <div className="inline-block rounded-lg bg-accent-soft/80 border border-accent/20 px-3.5 py-1.5">
                      <p className="text-xs font-bold text-accent">
                        THEME: Engineering a Sustainable Future
                      </p>
                    </div>

                    {/* Key Logistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Date &amp; Time</p>
                        <p className="text-sm font-bold text-ink">
                          {new Date(featuredEvent.startAt).toLocaleDateString("en-KE", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-neutral-600 font-medium">Prompt From: 6:00 PM</p>
                      </div>

                      <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Venue</p>
                        <p className="text-sm font-bold text-ink">{featuredEvent.location || "Trademark Hotel"}</p>
                        <p className="text-xs text-neutral-500">Nairobi, Kenya</p>
                      </div>
                    </div>

                    {/* Evening Palette */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-semibold text-neutral-600">Evening Dress Palette:</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#004B23] px-2.5 py-1 font-semibold text-white shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-emerald-300" />
                          Emerald Green
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#800020] px-2.5 py-1 font-semibold text-white shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-rose-300" />
                          Burgundy
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1 font-semibold text-white shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-neutral-400" />
                          Black
                        </span>
                      </div>
                    </div>

                    {/* Official Inquiries & Contacts */}
                    <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Inquiries &amp; Table Reservations</p>
                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 font-semibold text-neutral-700">
                        <a href="tel:+254113790205" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                          <span className="text-accent">📞</span>
                          <span>+254 113 790 205</span>
                        </a>
                        <span className="hidden sm:inline text-neutral-300">·</span>
                        <a href="tel:+254700850287" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                          <span className="text-accent">📞</span>
                          <span>+254 700 850 287</span>
                        </a>
                        <span className="hidden sm:inline text-neutral-300">·</span>
                        <a href="mailto:esa.kenyattauniv@gmail.com" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                          <span className="text-accent">✉️</span>
                          <span>esa.kenyattauniv@gmail.com</span>
                        </a>
                      </div>
                    </div>

                    {/* Description preview */}
                    {featuredEvent.description && (
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-3 pt-1">
                        {featuredEvent.description}
                      </p>
                    )}

                    {/* Call to Actions */}
                    <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-neutral-100">
                      {featuredEvent.registrationUrl ? (
                        <a
                          href={featuredEvent.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary !px-5 !py-2.5 !text-xs sm:!text-sm font-bold shadow-sm"
                        >
                          RSVP for Dinner →
                        </a>
                      ) : (
                        <Link
                          href="/events"
                          className="btn-primary !px-5 !py-2.5 !text-xs sm:!text-sm font-bold shadow-sm"
                        >
                          View Event Details →
                        </Link>
                      )}
                      <Link
                        href="/events"
                        className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        All Campus Events ({events.length}) →
                      </Link>
                    </div>
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
                  <h3 className="text-sm font-bold text-ink">Welcome to KU Engineering</h3>
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
                  Past Papers & Notes
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
              Academic Services
            </h2>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Essential Resources
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Gateway 1: Resources */}
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
                  Resources
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Access past examination papers, lecture notes, and lab manuals organized by course unit.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center text-xs font-semibold text-accent">
                Browse Resources →
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
