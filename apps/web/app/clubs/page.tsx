import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { db } from "@esa/db";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";

export default async function ClubsPage() {
  const user = await getCurrentUser();
  const clubs = await db.query.clubs.findMany({ orderBy: (c, { asc }) => asc(c.name) });

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={user ? isEsaAdmin(user) : false} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Student Societies</span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Technical Chapters & Engineering Clubs
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Discover student chapters affiliated with global professional institutions (IEEE, SAE, IEK)
            and specialized technical societies across Kenyatta University.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clubs/${c.slug}`}
                className="card block p-5 transition-all hover:border-accent hover:shadow-card-hover h-full flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-ink">
                      {c.name}
                    </h2>
                    {c.isPlatformOwner && (
                      <span className="badge-pill whitespace-nowrap !text-[10px] !py-0.5">
                        ESA Lead
                      </span>
                    )}
                  </div>
                  {c.category && (
                    <p className="mt-1 text-xs font-semibold text-accent uppercase tracking-wider">
                      {c.category}
                    </p>
                  )}
                  {c.description && (
                    <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-neutral-600">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-accent">
                  <span>View Chapter Profile</span>
                  <span>→</span>
                </div>
              </Link>
            </li>
          ))}
          {clubs.length === 0 && (
            <li className="col-span-full card p-8 text-center text-xs text-neutral-500">
              No technical chapters registered at this moment.
            </li>
          )}
        </ul>
      </main>
      <InstitutionalFooter />
      {user && <BottomNav />}
    </div>
  );
}
