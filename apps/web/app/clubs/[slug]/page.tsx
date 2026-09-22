import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@esa/db";
import { getCurrentUser } from "@/lib/auth";
import { isClubAdminFor, isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { ClubEventManager } from "@/components/ClubEventManager";
import { FollowClubButton } from "@/components/FollowClubButton";

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await db.query.clubs.findFirst({ where: (c, { eq }) => eq(c.slug, slug) });
  if (!club) notFound();

  const user = await getCurrentUser();
  const canManage = user ? await isClubAdminFor(user, club.id) : false;

  const events = await db.query.events.findMany({
    where: (e, { eq, isNotNull, and }) => and(eq(e.clubId, club.id), isNotNull(e.publishedAt)),
    orderBy: (e, { desc }) => desc(e.startAt),
    limit: 30,
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={user ? isEsaAdmin(user) : false} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/clubs" className="text-xs font-semibold text-accent hover:underline mb-4 inline-block">
          ← Back to All Chapters & Clubs
        </Link>

        <header className="card p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              {club.logoBlobUrl || club.isPlatformOwner ? (
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl border border-neutral-200 bg-white p-2 shadow-xs">
                  <img
                    src={club.logoBlobUrl || "/brand/logo.png"}
                    alt={club.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-accent-soft font-bold text-accent text-lg shadow-xs">
                  {club.name.slice(0, 3).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ink">
                    {club.name}
                  </h1>
                  {club.isPlatformOwner && (
                    <span className="badge-pill !text-xs font-semibold">Official Society</span>
                  )}
                </div>
                {club.category && (
                  <p className="mt-1 text-xs font-semibold text-accent uppercase tracking-wider">
                    {club.category}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FollowClubButton
                clubId={club.id}
                isLoggedIn={Boolean(user)}
                hasActiveBadge={user?.hasActiveBadge ?? false}
              />
              {!club.isPlatformOwner && club.externalUrl && (
                <a
                  href={club.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !text-xs font-semibold"
                >
                  External Site ↗
                </a>
              )}
            </div>
          </div>

          {club.description && (
            <p className="mt-5 text-xs sm:text-sm leading-relaxed text-neutral-600 max-w-3xl">
              {club.description}
            </p>
          )}
        </header>

        {canManage && (
          <div className="mb-8">
            <ClubEventManager clubId={club.id} />
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-ink">Scheduled Events & Activities</h2>
            <span className="text-xs text-neutral-500">{events.length} event(s)</span>
          </div>

          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-ink">{e.title}</h3>
                    {e.description && (
                      <p className="mt-1 text-xs text-neutral-600">{e.description}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right text-xs text-neutral-500 whitespace-nowrap">
                    <p className="font-semibold text-accent">
                      {new Date(e.startAt).toLocaleDateString("en-KE", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p>
                      {new Date(e.startAt).toLocaleTimeString("en-KE", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="card p-8 text-center text-xs text-neutral-500">
                No events currently published by this chapter.
              </li>
            )}
          </ul>
        </section>
      </main>
      <InstitutionalFooter />
      {user && <BottomNav />}
    </div>
  );
}
