"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  { href: "/events", label: "Events" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever user navigates to a new route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <Image
              src="/brand/logo.png"
              alt="ESA-KU Crest"
              width={38}
              height={24}
              priority
              className="transition-transform group-hover:scale-105"
            />
            <div className="leading-tight">
              <span className="block text-sm sm:text-base font-bold text-ink tracking-tight group-hover:text-accent transition-colors">
                ESA Kenyatta University
              </span>
              <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
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

          {/* Auth & Member Action Area + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <NotificationBell />

                {user.hasActiveBadge ? (
                  <Link
                    href="/profile"
                    className={`inline-flex items-center gap-1.5 rounded-md border border-brandgreen/30 bg-brandgreen-soft px-2.5 py-1.5 text-xs font-semibold text-brandgreen hover:bg-brandgreen/20 transition-colors ${
                      isActive(pathname, "/profile") ? "ring-2 ring-brandgreen ring-offset-1" : ""
                    }`}
                    title={`${user.fullName} · Member #${user.badgeNumber || ""} · View Profile`}
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="hidden xs:inline sm:inline">{user.badgeNumber || "Verified"}</span>
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-md border border-neutral-200 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors ${
                      isActive(pathname, "/profile") ? "border-accent bg-accent-soft text-accent" : ""
                    }`}
                    title={`${user.fullName} · View Profile`}
                  >
                    <span className="h-2 w-2 rounded-full bg-accent"></span>
                    <span className="max-w-[80px] sm:max-w-[110px] truncate">{user.fullName.split(" ")[0]}</span>
                    <span className="hidden sm:inline rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      Get Badge
                    </span>
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="rounded-md px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-primary !px-2.5 sm:!px-3.5 !py-1.5 !text-xs font-semibold whitespace-nowrap"
                >
                  Join ESA
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-accent md:hidden transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-neutral-200 bg-white shadow-xl md:hidden">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-ink"
                  }`}
                >
                  <span>{link.label}</span>
                  {active && <span className="h-2 w-2 rounded-full bg-accent" />}
                </Link>
              );
            })}

            {showAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(pathname, "/admin")
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span>Admin Console</span>
                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-white">Admin</span>
              </Link>
            )}
          </div>

          {/* Mobile Member / Auth Profile Box */}
          <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50/70">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 shadow-xs hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent font-bold text-xs">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">{user.fullName}</p>
                      <p className="text-[10px] text-neutral-500">
                        {user.badgeNumber ? `Member #${user.badgeNumber} · Active` : "Annual Membership"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-accent">Profile →</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-lg border border-neutral-300 bg-white py-2 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-lg bg-accent py-2 text-xs font-semibold text-white shadow-xs hover:bg-accent-hover transition-colors"
                >
                  Join ESA
                </Link>
              </div>
            )}

            {/* KU Portal and Institution Link */}
            <div className="mt-3 pt-2.5 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-500">
              <span>School of Engineering</span>
              <a
                href="https://www.ku.ac.ke"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline font-semibold"
              >
                KU Portal ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
