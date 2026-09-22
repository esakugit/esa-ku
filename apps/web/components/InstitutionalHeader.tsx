"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

export interface HeaderUser {
  fullName: string;
  hasActiveBadge?: boolean | null;
  badgeNumber?: string | null;
}

export interface InstitutionalHeaderProps {
  user: HeaderUser | null;
  showAdmin?: boolean;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/resources", label: "Resources" },
  { href: "/timetable", label: "Timetables" },
  { href: "/clubs", label: "Clubs & Chapters" },
  { href: "/notifications", label: "Notices" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InstitutionalHeader({ user, showAdmin = false }: InstitutionalHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs border-b border-neutral-200">
      {/* 1. Official Institutional Top Utility Bar */}
      <div className="bg-neutral-900 text-neutral-300 text-[11px] font-medium tracking-wide">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Kenyatta University</span>
            <span className="text-neutral-500">/</span>
            <span>School of Engineering & Architecture</span>
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <span className="text-neutral-400">Engineering Students Association (ESA)</span>
            <span className="text-neutral-600">·</span>
            <a
              href="https://www.ku.ac.ke"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              KU Portal ↗
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Institutional Navbar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/brand/logo.png"
              alt="ESA-KU Crest"
              width={42}
              height={26}
              priority
              className="transition-transform group-hover:scale-105"
            />
            <div className="leading-tight">
              <span className="block text-base font-bold text-ink tracking-tight group-hover:text-accent transition-colors">
                ESA Kenyatta University
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                School of Engineering
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {showAdmin && (
              <Link
                href="/admin"
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive(pathname, "/admin")
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-ink"
                }`}
              >
                Admin Console
              </Link>
            )}
          </nav>

          {/* Auth & Member Action Area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />

                {user.hasActiveBadge ? (
                  <Link
                    href="/profile"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-brandgreen/30 bg-brandgreen-soft px-2.5 py-1 text-xs font-semibold text-brandgreen hover:bg-brandgreen/15 transition-colors"
                    title="Active Member Badge"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{user.badgeNumber || "Verified Member"}</span>
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className="hidden sm:inline-flex items-center gap-1 rounded-md border border-flag/30 bg-flag-soft px-2.5 py-1 text-xs font-semibold text-flag hover:bg-flag-muted/30 transition-colors"
                  >
                    <span>Get Badge</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className={`flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors ${
                    isActive(pathname, "/profile") ? "border-accent bg-accent-soft text-accent" : ""
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-accent"></span>
                  <span className="max-w-[110px] truncate">{user.fullName.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-primary !px-3.5 !py-1.5 !text-xs font-semibold"
                >
                  Join ESA
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
