import { NextResponse } from "next/server";
import { db, timetableEntries, users, badges, events, subscriptions } from "@esa/db";
import { and, eq, gte, lte, isNotNull } from "drizzle-orm";
import { env } from "@/lib/env";
import { notifyUser } from "@/lib/push";
import { sendClassReminderEmail } from "@/lib/email";

/**
 * Called on a schedule (GitHub Actions in production — Vercel Hobby's Cron
 * Jobs only fire once a day, too coarse for "class starts in 15 minutes";
 * see spec §12). Idempotent: every notification's `link` doubles as a
 * dedupe key against notifications already logged for that user, so calling
 * this every 5–15 minutes never double-sends the same reminder.
 *
 * Two reminder types:
 *  - Class reminders: everyone in a cohort with an active Badge, for any
 *    class starting in the next 10–20 minutes today.
 *  - Event reminders: Badge holders who follow that club, for any event
 *    starting in the next 45–75 minutes.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { classReminders: 0, eventReminders: 0 };
  const now = new Date();

  // --- Active-badge user IDs, fetched once and reused below --------------
  const activeBadges = await db.query.badges.findMany({ where: eq(badges.status, "active") });
  const badgedUserIds = new Set(activeBadges.map((b) => b.userId));

  // --- Class reminders -----------------------------------------------------
  // Kenya Standard Time / East Africa Time (EAT) is always UTC+3 (no DST).
  // Calculate local time so serverless running in UTC correctly matches Kenyan class schedules.
  const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
  const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);

  const todayDow = (eatNow.getUTCDay() + 6) % 7; // JS getDay(): 0=Sun..6=Sat -> schema: 0=Mon..6=Sun
  const windowStart = new Date(eatNow.getTime() + 10 * 60 * 1000);
  const windowEnd = new Date(eatNow.getTime() + 20 * 60 * 1000);
  const hhmm = (d: Date) =>
    `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;

  const todaysEntries = await db.query.timetableEntries.findMany({
    where: and(
      eq(timetableEntries.dayOfWeek, todayDow),
      gte(timetableEntries.startTime, hhmm(windowStart)),
      lte(timetableEntries.startTime, hhmm(windowEnd)),
    ),
    with: { course: true },
  });

  const dateKey = eatNow.toISOString().slice(0, 10);
  for (const entry of todaysEntries) {
    const link = `/timetable#entry-${entry.id}-${dateKey}`;
    const cohortStudents = await db.query.users.findMany({ where: eq(users.cohortId, entry.cohortId) });

    for (const student of cohortStudents) {
      if (!badgedUserIds.has(student.id)) continue;
      const alreadySent = await db.query.notificationsLog.findFirst({
        where: (n, { and: andOp, eq: eqOp }) => andOp(eqOp(n.userId, student.id), eqOp(n.link, link)),
      });
      if (alreadySent) continue;

      await notifyUser({
        userId: student.id,
        type: "class_reminder",
        title: `Class starting soon: ${entry.course.code}`,
        body: `${entry.course.name} at ${entry.startTime.slice(0, 5)}${entry.venue ? ` · ${entry.venue}` : ""}`,
        link,
      });

      // Email notification directly to student's inbox
      if (student.email && env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
        try {
          await sendClassReminderEmail({
            to: student.email,
            courseCode: entry.course.code,
            courseName: entry.course.name,
            time: entry.startTime.slice(0, 5),
            venue: entry.venue,
          });
        } catch (err) {
          console.error(`Failed to send email reminder to ${student.email}:`, err);
        }
      }
      results.classReminders++;
    }

    // Also notify individual students who explicitly toggled reminders for this course
    const courseFollowers = await db.query.subscriptions.findMany({
      where: and(eq(subscriptions.subjectType, "course"), eq(subscriptions.subjectId, entry.courseId)),
    });

    for (const sub of courseFollowers) {
      if (!badgedUserIds.has(sub.userId)) continue;
      const subUser = await db.query.users.findFirst({ where: eq(users.id, sub.userId) });
      if (!subUser) continue;

      const alreadySent = await db.query.notificationsLog.findFirst({
        where: (n, { and: andOp, eq: eqOp }) => andOp(eqOp(n.userId, subUser.id), eqOp(n.link, link)),
      });
      if (alreadySent) continue;

      await notifyUser({
        userId: subUser.id,
        type: "class_reminder",
        title: `Class starting soon: ${entry.course.code}`,
        body: `${entry.course.name} at ${entry.startTime.slice(0, 5)}${entry.venue ? ` · ${entry.venue}` : ""}`,
        link,
      });

      if (subUser.email && env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
        try {
          await sendClassReminderEmail({
            to: subUser.email,
            courseCode: entry.course.code,
            courseName: entry.course.name,
            time: entry.startTime.slice(0, 5),
            venue: entry.venue,
          });
        } catch (err) {
          console.error(`Failed to send email reminder to ${subUser.email}:`, err);
        }
      }
      results.classReminders++;
    }
  }

  // --- Event reminders -----------------------------------------------------
  const eventWindowStart = new Date(now.getTime() + 45 * 60 * 1000);
  const eventWindowEnd = new Date(now.getTime() + 75 * 60 * 1000);
  const upcomingEvents = await db.query.events.findMany({
    where: and(gte(events.startAt, eventWindowStart), lte(events.startAt, eventWindowEnd), isNotNull(events.publishedAt)),
    with: { club: true },
  });

  for (const event of upcomingEvents) {
    const link = `/clubs/${event.club.slug}#event-${event.id}`;
    const followers = await db.query.subscriptions.findMany({
      where: and(eq(subscriptions.subjectType, "club"), eq(subscriptions.subjectId, event.clubId)),
    });

    for (const sub of followers) {
      if (!badgedUserIds.has(sub.userId)) continue;
      const alreadySent = await db.query.notificationsLog.findFirst({
        where: (n, { and: andOp, eq: eqOp }) => andOp(eqOp(n.userId, sub.userId), eqOp(n.link, link)),
      });
      if (alreadySent) continue;

      await notifyUser({
        userId: sub.userId,
        type: "event_reminder",
        title: `Starting soon: ${event.title}`,
        body: `${event.club.name}${event.location ? ` · ${event.location}` : ""}`,
        link,
      });
      results.eventReminders++;
    }
  }

  return NextResponse.json(results);
}
