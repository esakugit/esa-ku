"use client";

import { useState } from "react";
import Link from "next/link";

type EventItem = {
  id: number;
  clubId: number;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  coverImageBlobUrl: string | null;
  registrationUrl: string | null;
  isFeatured: boolean;
  club: { id: number; name: string; slug: string; logoBlobUrl: string | null };
};

type Club = {
  id: number;
  name: string;
  slug: string;
};

export function EventsFeedView({
  initialEvents,
  clubs,
}: {
  initialEvents: EventItem[];
  clubs: Club[];
}) {
  const [selectedClubId, setSelectedClubId] = useState<number | "all">("all");
  const [activePoster, setActivePoster] = useState<string | null>(null);

  const filtered = initialEvents.filter((e) => {
    if (selectedClubId === "all") return true;
    return e.clubId === selectedClubId;
  });

  const featured = filtered.find((e) => e.isFeatured) || (filtered.length > 0 ? filtered[0] : null);
  const others = featured ? filtered.filter((e) => e.id !== featured.id) : filtered;

  return (
    <div className="space-y-8">
      {/* Club Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedClubId("all")}
          className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            selectedClubId === "all"
              ? "bg-accent text-white shadow-xs"
              : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-ink"
          }`}
        >
          All Engineering Societies ({initialEvents.length})
        </button>
        {clubs.map((c) => {
          const count = initialEvents.filter((e) => e.clubId === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClubId(c.id)}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedClubId === c.id
                  ? "bg-accent text-white shadow-xs"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-ink"
              }`}
            >
              {c.name} {count > 0 && <span className="opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Featured Flagship Event Showcase with Poster */}
      {featured && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Poster Preview with Zoom on Click */}
            {featured.coverImageBlobUrl ? (
              <div className="relative group w-full lg:w-80 shrink-0 self-center lg:self-start">
                <div
                  onClick={() => setActivePoster(featured.coverImageBlobUrl)}
                  className="cursor-pointer overflow-hidden rounded-xl border border-neutral-200/80 shadow-md transition-transform hover:scale-[1.01]"
                >
                  <img
                    src={featured.coverImageBlobUrl}
                    alt={featured.title}
                    className="w-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    🔍 Click to enlarge poster
                  </div>
                </div>
                <p className="mt-2 text-center text-[11px] text-neutral-400">
                  Click poster to view full size
                </p>
              </div>
            ) : null}

            {/* Event Information & Details */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  ★ Flagship Event
                </span>
                <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                  {featured.club.name}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                {featured.title}
              </h2>

              {/* Theme Pill */}
              <div className="inline-block rounded-lg bg-accent-soft/70 border border-accent/20 px-3.5 py-1.5">
                <p className="text-xs font-bold text-accent">
                  THEME: Engineering a Sustainable Future
                </p>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3.5 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Date &amp; Schedule</p>
                  <p className="text-sm font-bold text-ink">
                    {new Date(featured.startAt).toLocaleDateString("en-KE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-neutral-600 font-medium">Prompt From: 6:00 PM</p>
                </div>

                <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3.5 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Venue</p>
                  <p className="text-sm font-bold text-ink">{featured.location || "Trademark Hotel"}</p>
                  <p className="text-xs text-neutral-500">Nairobi, Kenya</p>
                </div>
              </div>

              {/* Evening Palette */}
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold text-neutral-600">Evening Dress Palette:</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#004B23] px-2.5 py-1 font-semibold text-white shadow-2xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Emerald Green
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#800020] px-2.5 py-1 font-semibold text-white shadow-2xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                    Burgundy
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 py-1 font-semibold text-white shadow-2xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-400" />
                    Black
                  </span>
                </div>
              </div>

              {/* Official Inquiries & Contacts */}
              <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-xs space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Inquiries &amp; Table Reservations</p>
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 font-semibold text-neutral-700">
                  <a href="tel:+254113790205" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                    <span className="text-accent">📞</span>
                    <span>+254 113 790 205</span>
                  </a>
                  <span className="hidden sm:inline text-neutral-300">·</span>
                  <a href="tel:+254700850287" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                    <span className="text-accent">📞</span>
                    <span>+254 700 850 287</span>
                  </a>
                  <span className="hidden sm:inline text-neutral-300">·</span>
                  <a href="mailto:esa.kenyattauniv@gmail.com" className="inline-flex items-center gap-1.5 hover:text-accent transition-colors">
                    <span className="text-accent">✉️</span>
                    <span>esa.kenyattauniv@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Description */}
              {featured.description && (
                <div className="pt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line border-t border-neutral-100">
                  {featured.description}
                </div>
              )}

              {/* Contact Information & RSVP CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t border-neutral-100">
                {featured.registrationUrl && (
                  <a
                    href={featured.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary !px-6 !py-3 text-center !text-xs sm:!text-sm font-bold shadow-sm"
                  >
                    RSVP / Inquire for Dinner →
                  </a>
                )}
                {featured.coverImageBlobUrl && (
                  <button
                    type="button"
                    onClick={() => setActivePoster(featured.coverImageBlobUrl)}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    View Official Poster
                  </button>
                )}
                <Link
                  href={`/clubs/${featured.club.slug}`}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-600 hover:text-ink text-center"
                >
                  Visit {featured.club.name} Chapter →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Other Events Grid */}
      {others.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-ink">Upcoming Society Events &amp; Lectures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((e) => (
              <article key={e.id} className="card p-5 flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-colors">
                <div className="space-y-3">
                  {e.coverImageBlobUrl && (
                    <div
                      onClick={() => setActivePoster(e.coverImageBlobUrl)}
                      className="cursor-pointer overflow-hidden rounded-lg border border-neutral-100 max-h-48 bg-neutral-50"
                    >
                      <img
                        src={e.coverImageBlobUrl}
                        alt={e.title}
                        className="w-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                      {e.club.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(e.startAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-ink">{e.title}</h4>
                  {e.description && (
                    <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {e.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500 truncate">
                    📍 {e.location || "KU Main Campus"}
                  </span>
                  {e.registrationUrl ? (
                    <a
                      href={e.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-accent hover:underline shrink-0"
                    >
                      RSVP →
                    </a>
                  ) : (
                    <Link
                      href={`/clubs/${e.club.slug}`}
                      className="text-xs font-semibold text-neutral-600 hover:text-ink shrink-0"
                    >
                      Details →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card p-12 text-center text-sm text-neutral-500 space-y-2">
          <p className="font-semibold text-ink">No events found for this selection.</p>
          <p className="text-xs text-neutral-400">
            Check back soon or select "All Engineering Societies".
          </p>
        </div>
      )}

      {/* Full Poster Lightbox Modal */}
      {activePoster && (
        <div
          onClick={() => setActivePoster(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-h-[92vh] max-w-lg rounded-2xl bg-white p-2 shadow-2xl overflow-hidden">
            <button
              onClick={() => setActivePoster(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white font-bold hover:bg-black/80 text-sm"
            >
              ✕
            </button>
            <img
              src={activePoster}
              alt="Full event poster"
              className="max-h-[88vh] w-auto object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
