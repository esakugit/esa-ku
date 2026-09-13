import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@esa/db";
import { getCurrentUser } from "@/lib/auth";
import { isClubAdminFor } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
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
    <main className="mx-auto max-w-xl px-5 pb-24 pt-8">
      <Link href="/clubs" className="text-sm text-accent">
        ← All clubs
      </Link>

      <header className="my-4">
        <h1 className="text-2xl font-bold text-ink">
          {club.name} {club.isPlatformOwner && <span className="badge-pill ml-1">ESA</span>}
        </h1>
        {club.category && <p className="mt-1 text-sm text-neutral-500">{club.category}</p>}
        {club.description && <p className="mt-3 text-sm text-neutral-600">{club.description}</p>}
        {club.externalUrl && (
          <a
            href={club.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-4 inline-flex"
          >
            Visit club site ↗
          </a>
        )}
        <div>
          <FollowClubButton clubId={club.id} isLoggedIn={Boolean(user)} hasActiveBadge={user?.hasActiveBadge ?? false} />
        </div>
      </header>

      {canManage && <ClubEventManager clubId={club.id} />}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Events</h2>
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="card p-4">
              <p className="text-sm font-semibold text-ink">{e.title}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {new Date(e.startAt).toLocaleString("en-KE", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.description && <p className="mt-2 text-sm text-neutral-600">{e.description}</p>}
            </li>
          ))}
          {events.length === 0 && (
            <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
              No events posted yet.
            </p>
          )}
        </ul>
      </section>

      {user && <BottomNav />}
    </main>
  );
}
