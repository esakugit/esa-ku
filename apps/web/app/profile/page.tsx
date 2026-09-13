import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { SignOutButton } from "@/components/SignOutButton";
import { BottomNav } from "@/components/BottomNav";
import { BadgeSection } from "@/components/BadgeSection";
import { PushSubscribeToggle } from "@/components/PushSubscribeToggle";
import { env } from "@/lib/env";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  class_rep: "Class representative",
  club_admin: "Club committee member",
  esa_admin: "ESA admin",
  super_admin: "Super admin",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-xl px-5 pb-24 pt-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Profile</h1>

      {!user.departmentId && (
        <div className="card mb-6 flex items-center justify-between gap-4 border-flag/30 bg-flag-soft p-4">
          <p className="text-sm text-ink">Add your department to see your class timetable.</p>
          <Link href="/complete-profile" className="btn-primary whitespace-nowrap">
            Complete
          </Link>
        </div>
      )}

      <BadgeSection
        fullName={user.fullName}
        hasActiveBadge={user.hasActiveBadge}
        badgeNumber={user.badgeNumber}
        tillNumber={env.NEXT_PUBLIC_ESA_TILL_NUMBER}
        tillName={env.NEXT_PUBLIC_ESA_TILL_NAME}
      />

      <div className="card space-y-3 p-5">
        <Row label="Name" value={user.fullName} />
        <Row label="Email" value={user.email} />
        <Row label="Role" value={ROLE_LABELS[user.role] ?? user.role} />
        <Row label="Email verified" value={user.emailVerifiedAt ? "Yes" : "No"} />
      </div>

      {user.hasActiveBadge && (
        <div className="card mt-4 p-5">
          <p className="mb-1 text-sm font-semibold text-ink">Notifications</p>
          <p className="mb-3 text-sm text-neutral-500">
            Get a push alert on this device for class and event reminders.
          </p>
          <PushSubscribeToggle />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {isEsaAdmin(user) && (
          <Link href="/admin" className="btn-secondary w-full">
            Admin console
          </Link>
        )}
        {user.departmentId && (
          <Link href="/complete-profile" className="btn-secondary w-full">
            Change department / intake year
          </Link>
        )}
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>

      <BottomNav />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
