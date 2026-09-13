import "server-only";
import webpush from "web-push";
import { db, pushSubscriptions, notificationsLog } from "@esa/db";
import { eq } from "drizzle-orm";
import { env } from "./env";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export type NotificationInput = {
  userId: number;
  type: string; // "class_reminder" | "event_reminder" | "badge_decision" | ...
  title: string;
  body?: string;
  link?: string;
};

/**
 * Writes the in-app notification row (always, spec §09 — in-app is free-ish
 * data students already have access to view once they open it) and, if the
 * user has a push subscription and VAPID keys are configured, also sends a
 * Web Push message. Push delivery failures never throw — a stale/expired
 * subscription just gets cleaned up so one bad row doesn't break a batch.
 */
export async function notifyUser(input: NotificationInput): Promise<void> {
  await db.insert(notificationsLog).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });

  if (!ensureConfigured()) return;

  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, input.userId),
  });
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: input.title,
    body: input.body ?? "",
    link: input.link ?? "/",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (browser reset, uninstall, expired) — clean up.
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error(`Push send failed for subscription ${sub.id}:`, err);
        }
      }
    }),
  );
}

/** Same as notifyUser but for many recipients at once (event/class reminders). */
export async function notifyUsers(
  userIds: number[],
  fields: Omit<NotificationInput, "userId">,
): Promise<void> {
  await Promise.all(userIds.map((userId) => notifyUser({ userId, ...fields })));
}
