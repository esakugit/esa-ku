import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { SignOutButton } from "@/components/SignOutButton";
import { BottomNav } from "@/components/BottomNav";
import { SidebarNav } from "@/components/SidebarNav";
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

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="md:flex">
      <SidebarNav showAdmin={isEsaAdmin(user)} />
      <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:max-w-3xl md:px-10 md:py-10 md:pb-10 lg:max-w-4xl md:ml-56">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-8">
          <div className="min-w-0">
            {/* Identity header */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-brandgreen text-lg font-bold text-white shadow-sm">
                {initials(user.fullName)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-ink">{user.fullName}</h1>
                <p className="truncate text-sm text-neutral-500">{user.email}</p>
                <span className="badge-pill mt-1.5">{ROLE_LABELS[user.role] ?? user.role}</span>
              </div>
            </div>

            {!user.profileComplete && (
              <div className="card mb-6 flex items-center justify-between gap-4 border-flag/30 bg-flag-soft p-4">
                <p className="text-sm text-ink">Finish setting up your profile to see your class timetable.</p>
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

            {user.hasActiveBadge && (
              <div className="card mb-6 p-5">
                <p className="mb-1 text-sm font-semibold text-ink">Notifications</p>
                <p className="mb-3 text-sm text-neutral-500">
                  Get a push alert on this device for class and event reminders.
                </p>
                <PushSubscribeToggle />
              </div>
            )}
          </div>

          {/* Right column on desktop, falls below on mobile */}
          <div className="min-w-0">
            <SectionLabel>Account details</SectionLabel>
            <div className="card mb-6 divide-y divide-neutral-100">
              <DetailRow label="Reg. number" value={user.regNo ?? "Not set"} muted={!user.regNo} />
              <DetailRow label="Email verified" value={user.emailVerifiedAt ? "Verified" : "Not verified"} good={Boolean(user.emailVerifiedAt)} />
            </div>

            <SectionLabel>Settings</SectionLabel>
            <div className="card mb-6 divide-y divide-neutral-100 overflow-hidden">
              {isEsaAdmin(user) && <SettingsRow href="/admin" label="Admin console" />}
              {user.profileComplete && (
                <SettingsRow href="/complete-profile" label="Department, intake & reg. number" />
              )}
              <SignOutButton variant="row" />
            </div>
          </div>
        </div>

        <BottomNav />
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{children}</p>;
}

function DetailRow({ label, value, muted, good }: { label: string; value: string; muted?: boolean; good?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-neutral-500">{label}</span>
      <span
        className={
          "text-sm font-medium " +
          (muted ? "text-neutral-400" : good === true ? "text-brandgreen" : good === false ? "text-flag" : "text-ink")
        }
      >
        {value}
      </span>
    </div>
  );
}

function SettingsRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-neutral-50">
      {label}
      <span aria-hidden className="text-neutral-300">
        ›
      </span>
    </Link>
  );
}
