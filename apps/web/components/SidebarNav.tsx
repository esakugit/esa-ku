"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/timetable", label: "Timetable" },
  { href: "/resources", label: "Resources" },
  { href: "/clubs", label: "Clubs" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Fixed left sidebar shown on desktop widths (md+) in place of BottomNav.
 * Mirrors BottomNav's destinations plus, for ESA admins, a separated
 * Admin console link near the bottom.
 */
export function SidebarNav({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-neutral-200 bg-neutral-50 md:flex">
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <Image src="/brand/logo.png" alt="ESA-KU" width={36} height={21} priority />
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          ESA Campus
        </span>
      </div>

      <ul className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {showAdmin && (
        <div className="border-t border-neutral-200 px-3 py-3">
          <Link
            href="/admin"
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, "/admin")
                ? "bg-accent-soft text-accent"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-ink"
            }`}
          >
            Admin console
          </Link>
        </div>
      )}
    </nav>
  );
}
