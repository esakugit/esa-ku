import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { BadgeQueue } from "@/components/admin/BadgeQueue";
import { env } from "@/lib/env";

export default async function AdminBadgesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isEsaAdmin(user)) redirect("/");

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={true} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2 text-xs">
            <Link href="/admin" className="text-neutral-500 hover:text-ink">
              ← Admin Console
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Membership Badge Verification Queue
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600">
            Cross-check student M-Pesa transaction reference codes against the official till statement
            for {env.NEXT_PUBLIC_ESA_TILL_NAME} (Till: {env.NEXT_PUBLIC_ESA_TILL_NUMBER}) before authorizing.
          </p>
        </header>

        <BadgeQueue />
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}
