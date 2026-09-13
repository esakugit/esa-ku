"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationList() {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((rows) => {
        setRows(rows);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  const unreadCount = rows.filter((r) => !r.readAt).length;

  if (loaded && rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
        Nothing yet — reminders for your classes and followed clubs will show up here.
      </p>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <button onClick={markAllRead} className="mb-3 text-sm text-accent">
          Mark all {unreadCount} as read
        </button>
      )}
      <ul className="space-y-2">
        {rows.map((n) => (
          <li key={n.id} className={`card p-4 ${n.readAt ? "" : "border-accent/30 bg-accent-soft"}`}>
            <Link href={n.link ?? "#"} className="block">
              <p className="text-sm font-semibold text-ink">{n.title}</p>
              {n.body && <p className="mt-1 text-sm text-neutral-600">{n.body}</p>}
              <p className="mt-2 text-xs text-neutral-400">
                {new Date(n.createdAt).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
