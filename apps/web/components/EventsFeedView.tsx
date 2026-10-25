"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

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
  cost: string | null;
  isFeatured: boolean;
  club: { id: number; name: string; slug: string; logoBlobUrl: string | null };
};

type Club = {
  id: number;
  name: string;
  slug: string;
};

type ActivePosterState = {
  url: string;
  title: string;
  clubName?: string;
  event?: EventItem;
} | null;

export function EventsFeedView({
  initialEvents,
  clubs,
}: {
  initialEvents: EventItem[];
  clubs: Club[];
}) {
  const { success } = useToast();
  const [selectedClubId, setSelectedClubId] = useState<number | "all">("all");
  const [activePoster, setActivePoster] = useState<ActivePosterState>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const filtered = initialEvents.filter((e) => {
    if (selectedClubId === "all") return true;
    return e.clubId === selectedClubId;
  });

  const featured = filtered.find((e) => e.isFeatured) || (filtered.length > 0 ? filtered[0] : null);
  const others = featured ? filtered.filter((e) => e.id !== featured.id) : filtered;

  function getPosterDownloadUrl(url: string, title: string) {
    return `/api/events/download-poster?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  }

  function handleDirectDownload(url: string, title: string) {
    setDownloadingUrl(url);
    try {
      const downloadUrl = getPosterDownloadUrl(url, title);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `ESA_KU_${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Poster`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success("Download started", `Downloading official poster for "${title}".`);
    } finally {
      setTimeout(() => setDownloadingUrl(null), 1000);
    }
  }

  function shareOnWhatsApp(e: EventItem) {
    const dateStr = new Date(e.startAt).toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const text = `🎓 *${e.title}*\n🏛️ Hosted by: ${e.club.name}\n📅 Date: ${dateStr}\n📍 Venue: ${e.location || "KU Main Campus"}${e.cost ? `\n🎟️ Tickets: ${e.cost}` : ""}\n\n👉 View details & official poster on the ESA Platform: ${typeof window !== "undefined" ? window.location.origin : ""}/events`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function copyPublicityLink(e: EventItem) {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/events`;
    await navigator.clipboard.writeText(link);
    success("Link copied", `Event link copied to clipboard. Ready to paste in class groups!`);
  }

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
            {/* Poster Preview with Zoom on Click & Quick Download Actions */}
            {featured.coverImageBlobUrl ? (
              <div className="relative group w-full lg:w-80 shrink-0 self-center lg:self-start">
                <div
                  onClick={() =>
                    setActivePoster({
                      url: featured.coverImageBlobUrl!,
                      title: featured.title,
                      clubName: featured.club.name,
                      event: featured,
                    })
                  }
                  className="cursor-pointer overflow-hidden rounded-xl border border-neutral-200/80 shadow-md transition-transform hover:scale-[1.01]"
                >
                  <img
                    src={featured.coverImageBlobUrl}
                    alt={featured.title}
                    className="w-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white text-xs font-semibold gap-2 p-4 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
                      🔍 Click to enlarge poster
                    </span>
                    <span className="text-[11px] text-white/80">Click to view & download full resolution</span>
                  </div>
                </div>

                {/* Poster Action Buttons Under Featured Poster */}
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={getPosterDownloadUrl(featured.coverImageBlobUrl, featured.title)}
                    download
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectDownload(featured.coverImageBlobUrl!, featured.title);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 hover:border-neutral-400 transition-colors shadow-2xs"
                  >
                    <span>📥</span>
                    <span>{downloadingUrl === featured.coverImageBlobUrl ? "Downloading..." : "Download Poster"}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => shareOnWhatsApp(featured)}
                    title="Share event announcement to WhatsApp"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    <span>💬</span>
                    <span>Share</span>
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[11px] text-neutral-400">
                  Official High-Res Poster · Kenyatta University
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
              <div className={`grid grid-cols-1 ${featured.cost ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 pt-2`}>
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

                {featured.cost ? (
                  <div className="rounded-xl border border-accent/20 bg-accent-soft/50 p-3.5 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Admission / Tickets</p>
                    <p className="text-sm font-extrabold text-ink">{featured.cost}</p>
                    <p className="text-xs text-neutral-500">Official Pass</p>
                  </div>
                ) : null}
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
              <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-neutral-100">
                {featured.registrationUrl && (
                  <a
                    href={featured.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary !px-6 !py-2.5 text-center !text-xs sm:!text-sm font-bold shadow-sm"
                  >
                    RSVP / Inquire for Dinner →
                  </a>
                )}

                {featured.coverImageBlobUrl && (
                  <a
                    href={getPosterDownloadUrl(featured.coverImageBlobUrl, featured.title)}
                    download
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectDownload(featured.coverImageBlobUrl!, featured.title);
                    }}
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>📥</span>
                    <span>Download Official Poster</span>
                  </a>
                )}

                {featured.coverImageBlobUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setActivePoster({
                        url: featured.coverImageBlobUrl!,
                        title: featured.title,
                        clubName: featured.club.name,
                        event: featured,
                      })
                    }
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    Preview Full Size
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-ink">Upcoming Society Events &amp; Lectures</h3>
            <p className="text-xs text-neutral-500">
              Download posters and share on student WhatsApp groups to help publicise upcoming events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((e) => (
              <article key={e.id} className="card p-5 flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-colors">
                <div className="space-y-3">
                  {e.coverImageBlobUrl && (
                    <div className="relative group overflow-hidden rounded-lg border border-neutral-100 max-h-48 bg-neutral-50">
                      <img
                        src={e.coverImageBlobUrl}
                        alt={e.title}
                        className="w-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() =>
                          setActivePoster({
                            url: e.coverImageBlobUrl!,
                            title: e.title,
                            clubName: e.club.name,
                            event: e,
                          })
                        }
                      />
                      {/* Hover action bar overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePoster({
                              url: e.coverImageBlobUrl!,
                              title: e.title,
                              clubName: e.club.name,
                              event: e,
                            })
                          }
                          className="rounded bg-black/60 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black/80 backdrop-blur-xs"
                        >
                          🔍 Enlarge
                        </button>
                        <a
                          href={getPosterDownloadUrl(e.coverImageBlobUrl, e.title)}
                          download
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDirectDownload(e.coverImageBlobUrl!, e.title);
                          }}
                          className="rounded bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-accent-hover shadow-xs inline-flex items-center gap-1"
                        >
                          <span>📥</span>
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                        {e.club.name}
                      </span>
                      {e.cost && (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          🎟️ {e.cost}
                        </span>
                      )}
                    </div>
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
                  <div className="flex items-center gap-2">
                    {e.coverImageBlobUrl && (
                      <a
                        href={getPosterDownloadUrl(e.coverImageBlobUrl, e.title)}
                        download
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleDirectDownload(e.coverImageBlobUrl!, e.title);
                        }}
                        className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors inline-flex items-center gap-1"
                        title="Download poster for WhatsApp or print publicity"
                      >
                        <span>📥</span>
                        <span>Poster</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => shareOnWhatsApp(e)}
                      className="rounded border border-emerald-200 bg-emerald-50/70 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                      title="Share to WhatsApp"
                    >
                      <span>💬</span>
                      <span>Share</span>
                    </button>
                  </div>

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

      {/* Full Poster Lightbox Modal with Dedicated Download & Share Suite */}
      {activePoster && (
        <div
          onClick={() => setActivePoster(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-sm cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col max-h-[95vh] w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50">
              <div className="pr-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">Official Event Poster</p>
                <h4 className="text-sm font-bold text-ink truncate max-w-md">{activePoster.title}</h4>
                {activePoster.clubName && (
                  <p className="text-[11px] text-neutral-500">{activePoster.clubName} · Kenyatta University</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActivePoster(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold text-sm transition-colors"
                title="Close poster modal"
              >
                ✕
              </button>
            </div>

            {/* Poster Image Container */}
            <div className="flex-1 overflow-auto p-3 bg-neutral-900/5 flex items-center justify-center">
              <img
                src={activePoster.url}
                alt={activePoster.title}
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Modal Publicity Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3 bg-white">
              <p className="text-xs text-neutral-500 hidden sm:block">
                High-resolution file ready for status, groups &amp; print.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={getPosterDownloadUrl(activePoster.url, activePoster.title)}
                  download
                  onClick={() => handleDirectDownload(activePoster.url, activePoster.title)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-hover transition-colors shadow-xs"
                >
                  <span>📥</span>
                  <span>Download High-Res Poster</span>
                </a>

                {activePoster.event && (
                  <button
                    type="button"
                    onClick={() => shareOnWhatsApp(activePoster.event!)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>
                )}

                {activePoster.event && (
                  <button
                    type="button"
                    onClick={() => copyPublicityLink(activePoster.event!)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Copy publicity link to clipboard"
                  >
                    <span>🔗</span>
                    <span>Link</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActivePoster(null)}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
