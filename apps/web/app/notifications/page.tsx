import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { NotificationList } from "@/components/NotificationList";

import { db, announcements } from "@esa/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let officialAnnouncements: Awaited<ReturnType<typeof db.query.announcements.findMany>> = [];
  try {
    officialAnnouncements = await db.query.announcements.findMany({
      orderBy: [desc(announcements.pinned), desc(announcements.publishedAt)],
      limit: 20,
    });
  } catch (err) {
    console.error("[NotificationsPage] DB query failed:", err);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={isEsaAdmin(user)} />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Communications</span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Official Notices & Circulars
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600">
              Department circulars, timetable alterations, bursaries, and society announcements.
            </p>
          </div>
          {isEsaAdmin(user) && (
            <Link href="/admin" className="btn-primary !text-xs !py-2 !px-3 self-start sm:self-auto">
              + Post Notice (Admin)
            </Link>
          )}
        </header>

        {/* 1. Official Society & Department Circulars */}
        {officialAnnouncements.length > 0 && (
          <section className="mb-8 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              University &amp; Society Circulars
            </h2>
            <div className="space-y-3">
              {officialAnnouncements.map((a) => (
                <article
                  key={a.id}
                  className={`card p-5 space-y-2 ${a.priority === "urgent" ? "border-l-4 border-l-red-500" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {a.pinned && (
                        <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          📌 Pinned
                        </span>
                      )}
                      {a.priority === "urgent" && (
                        <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          🔴 Urgent Notice
                        </span>
                      )}
                      <span className="rounded bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-700">
                        {a.category}
                      </span>
                    </div>
                    <span className="text-neutral-400">
                      {new Date(a.publishedAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink">{a.title}</h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                    {a.content}
                  </p>

                  {a.actionUrl && (
                    <div className="pt-2">
                      <a
                        href={a.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                      >
                        Official Document / External Link ↗
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">
          Personal Class &amp; Event Notifications
        </h2>

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
