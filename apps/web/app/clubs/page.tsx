import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@esa/db";
import { BottomNav } from "@/components/BottomNav";

export default async function ClubsPage() {
  const user = await getCurrentUser();
  const clubs = await db.query.clubs.findMany({ orderBy: (c, { asc }) => asc(c.name) });

  return (
    <main className="mx-auto max-w-xl px-5 pb-24 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Campus clubs</p>
        <h1 className="mt-0.5 text-2xl font-bold text-ink">Clubs directory</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every KU engineering club is listed here, free to browse. Clubs whose committee holds an
          ESA Badge can also post events and updates right here in the app.
        </p>
      </header>

      <ul className="space-y-3">
        {clubs.map((c) => (
          <li key={c.id}>
            <Link href={`/clubs/${c.slug}`} className="card block p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.name} {c.isPlatformOwner && <span className="badge-pill ml-1">ESA</span>}
                  </p>
                  {c.category && <p className="mt-0.5 text-xs text-neutral-500">{c.category}</p>}
                  {c.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{c.description}</p>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {clubs.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
            No clubs listed yet.
          </p>
        )}
      </ul>

      {user && <BottomNav />}
    </main>
  );
}
