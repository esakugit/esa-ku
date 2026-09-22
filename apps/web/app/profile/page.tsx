import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isEsaAdmin } from "@/lib/roles";
import { SignOutButton } from "@/components/SignOutButton";
import { BottomNav } from "@/components/BottomNav";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import { BadgeSection } from "@/components/BadgeSection";
import { PushSubscribeToggle } from "@/components/PushSubscribeToggle";
import { env } from "@/lib/env";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  class_rep: "Class Rep",
  club_admin: "Club Admin",
  esa_admin: "ESA Admin",
  super_admin: "Super Admin",
};

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-ink">
      <InstitutionalHeader user={user} showAdmin={isEsaAdmin(user)} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Profile
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* User Identity Card */}
            <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-neutral-900 text-lg font-bold text-white shadow-xs">
                {initials(user.fullName)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-ink">{user.fullName}</h2>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="badge-pill !text-xs font-semibold">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                  {user.regNo && (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-700">
                      {user.regNo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Profile setup banner */}
            {!user.profileComplete && (
              <div className="card flex items-center justify-between gap-4 border-flag/30 bg-flag-soft p-5">
                <div>
                  <p className="text-sm font-semibold text-ink">Academic Profile</p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    Set your department and study year to access timetables and course materials.
                  </p>
                </div>
                <Link href="/complete-profile" className="btn-primary !text-xs whitespace-nowrap">
                  Set Details
                </Link>
              </div>
            )}

            {/* Large Bank Card Geometry Membership Badge */}
            <BadgeSection
              fullName={user.fullName}
              hasActiveBadge={user.hasActiveBadge}
              badgeNumber={user.badgeNumber}
              regNo={user.regNo}
              tillNumber={env.NEXT_PUBLIC_ESA_TILL_NUMBER}
              tillName={env.NEXT_PUBLIC_ESA_TILL_NAME}
              badgeFee={env.NEXT_PUBLIC_ESA_BADGE_FEE}
              legacyCardImageUrl={user.legacyCardImageUrl}
            />

            {user.hasActiveBadge && (
              <div className="card p-6">
                <h3 className="text-sm font-bold text-ink">Push Notifications</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Receive timetable reminders and official notice alerts directly on your device.
                </p>
                <div className="mt-4">
                  <PushSubscribeToggle />
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div>
              <SectionLabel>Student Details</SectionLabel>
              <div className="card divide-y divide-neutral-100">
                <DetailRow label="Registration No." value={user.regNo ?? "Pending Setup"} muted={!user.regNo} />
                <DetailRow
                  label="Email"
                  value={user.emailVerifiedAt ? "Verified" : "Unverified"}
                  good={Boolean(user.emailVerifiedAt)}
                />
                <DetailRow
                  label="Membership Card"
                  value={user.hasActiveBadge ? `Active (${user.badgeNumber})` : "Inactive"}
                  good={user.hasActiveBadge}
                />
              </div>
            </div>

            <div>
              <SectionLabel>Account</SectionLabel>
              <div className="card divide-y divide-neutral-100 overflow-hidden">
                {isEsaAdmin(user) && <SettingsRow href="/admin" label="Admin Console" />}
                {user.profileComplete && (
                  <SettingsRow href="/complete-profile" label="Update Academic Details" />
                )}
                <SignOutButton variant="row" />
              </div>
            </div>
          </div>
        </div>
      </main>
      <InstitutionalFooter />
      <BottomNav />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">{children}</p>;
}

function DetailRow({ label, value, muted, good }: { label: string; value: string; muted?: boolean; good?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 text-xs">
      <span className="text-neutral-500 font-medium">{label}</span>
      <span
        className={
          "font-semibold " +
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
    <Link href={href} className="flex items-center justify-between px-5 py-3 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50">
      {label}
      <span aria-hidden className="text-neutral-400 font-normal">
        →
      </span>
    </Link>
  );
}
