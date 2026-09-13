"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { readAt: string | null }[]) => setUnread(rows.filter((r) => !r.readAt).length))
      .catch(() => {});
  }, []);

  return (
    <Link href="/notifications" className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-100" aria-label="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-flag px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
