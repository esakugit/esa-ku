# ESA Campus Platform

Membership Badge, campus club directory + events, a unified class timetable,
and a past-papers/resources library — a PWA for the Engineering Students
Association at Kenyatta University. Runs at $0/month on Vercel Hobby + Neon
free Postgres + Vercel Blob free tier.

See `esa-platform-spec.html` (one level up, or published as an Artifact) for
the full architecture and product spec this code follows.

## Status — complete

Every feature from the spec's build plan is built and has been tested
end-to-end against a local Postgres database (signup → email verification →
login → Badge apply/verify/approve → club + event posting → cross-department
timetable gating → past-papers upload/moderation → follow + push/in-app
notifications → admin console), including the RBAC rules (elevated roles and
notifications require an active Badge; a student's own cohort timetable and
the resources library are free for everyone).

## The membership model, in one paragraph

Every matriculated KU engineering student is already an ESA member — there is
no "join ESA" step. The **Badge** is a paid, optional incentive tier that
funds ESA's events. Free for everyone regardless of Badge: browsing every
club's listing, your own cohort's timetable, and the past-papers/resources
library. Badge-gated: in-app/push notifications, browsing *other* cohorts'
timetables, and exercising any elevated role (class rep, club committee
member, ESA admin — a role with a lapsed Badge is inert, not deleted).
Payment is a simple till-number flow: a student pays, pastes the M-Pesa
confirmation code, and an ESA admin verifies it against the till statement
before approving and issuing a sequential Badge number.

## Stack

- **Next.js 15** (App Router) on **Vercel** — `apps/web`
- **Postgres** via **Drizzle ORM**, using the standard `pg` driver
  (`drizzle-orm/node-postgres`) — `packages/db`. This is the same code path
  for local Postgres and Neon in production: Neon speaks the normal Postgres
  wire protocol on its pooled connection string, so nothing driver-specific
  needs to change between dev and prod.
- **Tailwind CSS**, with a small brand token set sampled from the ESA-KU logo
- Sessions: signed JWT in an httpOnly cookie (`jose`), not a third-party auth
  service
- Email: Gmail SMTP via `nodemailer` + a Google App Password
- Push: Web Push (`web-push`) with a VAPID keypair
- File storage: pluggable — `local` (disk, for dev) or `blob` (Vercel Blob,
  for production), selected by `STORAGE_DRIVER`
- Scheduling: GitHub Actions calls `/api/cron/notify` every 10 minutes
  (Vercel Hobby's own Cron Jobs only run once a day — too coarse for class
  reminders)

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Local database setup

This sandbox/dev setup uses a real local Postgres — no cloud account needed
to start building or testing.

```bash
# Debian/Ubuntu, adjust for your OS
sudo apt-get install postgresql
sudo service postgresql start

sudo -u postgres psql -c "CREATE ROLE esa_dev WITH LOGIN PASSWORD 'esa_dev' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE esa_platform_dev OWNER esa_dev;"
```

### 3. Configure environment variables

```bash
cp .env.example apps/web/.env.local
```

The default `DATABASE_URL` in `.env.example` already matches the role/db
created above. Fill in `SESSION_SECRET` and `CRON_SECRET` with random strings
(`openssl rand -base64 32`). Everything else has a sensible dev default —
leave `GMAIL_USER`/`GMAIL_APP_PASSWORD` and the VAPID keys blank at first (see
below for how to fill them in when you're ready to test email/push).

### 4. Run migrations

```bash
pnpm db:generate   # already run once — only needed again after schema changes
pnpm db:migrate    # applies migrations to DATABASE_URL
```

No seed script — the database starts empty on purpose (see "First run" below).

### 5. Run it

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## First run: bootstrapping a fresh install

There's no seed data and no admin account baked in. Instead:

1. **The first person to sign up automatically becomes Super Admin.** Do this
   yourself first, before sharing the link with students.
2. Verify that account (in dev, the sign-up response shows a "click to
   verify" link when Gmail isn't configured yet).
3. Log in, go to **Profile → Admin console**, and add your real departments
   and courses.
4. Add clubs (ESA itself should be added with "platform owner" checked when
   you build that toggle into the form, or via the API) — the app doesn't
   assume ESA already exists as a club.
5. From your profile, go back and complete your own department/intake year
   (`/complete-profile`) once departments exist.
6. From then on, ordinary sign-ups are just students — promote class reps,
   club committee members and additional ESA admins from **Admin console →
   Roles**.

## Turning on email and push (optional for local dev)

**Email** (verification links, Badge decisions): create a dedicated ESA
Gmail account, turn on 2-Step Verification, then generate an **App
Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
Put the 16-character app password (not the normal Gmail password) in
`GMAIL_APP_PASSWORD`, and the address in `GMAIL_USER`.

**Push notifications**: generate a VAPID keypair —

```bash
cd apps/web && node -e "console.log(require('web-push').generateVAPIDKeys())"
```

— and put the two keys in `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, plus the
public key again in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Next.js only inlines
`NEXT_PUBLIC_*` vars into the browser bundle). **Use a different keypair for
production than whatever you generate for local testing.**

Both are optional in dev — the app degrades gracefully (dev-mode verify
links instead of email; the push-subscribe button just won't be configured).

## Project layout

```
esa-platform/
├─ apps/web/                 # Next.js app — everything user-facing
│  ├─ app/                    # pages + API routes (App Router)
│  │  ├─ api/                  # REST-ish route handlers
│  │  │  ├─ auth/, profile/, departments/, courses/, cohorts/
│  │  │  ├─ clubs/, events/, badges/, timetable/, resources/
│  │  │  ├─ subscriptions/, notifications/, push/, cron/
│  │  │  └─ users/                  # search + role assignment (admin)
│  │  ├─ admin/                # admin console, Badge queue, resource moderation
│  │  ├─ clubs/, timetable/, resources/, notifications/, profile/
│  │  └─ sign-up/, login/, complete-profile/
│  ├─ components/
│  ├─ lib/                     # auth, roles/RBAC, storage, email, push, env validation
│  └─ public/                  # manifest.json, service worker, icons
├─ packages/db/
│  ├─ src/schema.ts            # Drizzle schema — all 13 tables from spec §05
│  ├─ src/client.ts            # pg + drizzle-orm/node-postgres — same code, local or Neon
│  └─ migrations/              # generated SQL, committed to the repo
├─ .github/workflows/notify-cron.yml   # calls /api/cron/notify every 10 minutes
└─ pnpm-workspace.yaml
```

## How the RBAC actually works

`apps/web/lib/roles.ts` is the one place this logic lives:

- `student` — the default role, always active (no Badge required).
- `class_rep`, `club_admin`, `esa_admin` — only *effective* while that
  person's Badge is active. The role itself isn't deleted when a Badge
  lapses (so it comes back the moment they renew), but every check in the
  app (`isClubAdminFor`, `isClassRepFor`, `isEsaAdmin`) also checks
  `hasActiveBadge`.
- `super_admin` — exempt from the Badge requirement. It exists purely to
  bootstrap a fresh install (see above) and should stay a small, trusted set
  of people.

Every API route that mutates something gated by role re-checks it
server-side (never trust the client) — see `apps/web/lib/api.ts` for the
`requireApiUser`/`requireApiEsaAdmin` guards used throughout.

## Deploying to production

1. Push this repo to GitHub.
2. Create a free [Neon](https://neon.tech) project, copy its **pooled**
   connection string.
3. Import the repo into Vercel — set the project's root directory to
   `apps/web`.
4. In Vercel project settings, add every variable from `.env.example`,
   using the Neon connection string for `DATABASE_URL`, a fresh
   `SESSION_SECRET`, your real Gmail app password, a **new** VAPID keypair,
   `STORAGE_DRIVER=blob` + a Blob token from Vercel Storage, and
   `ALLOWED_STUDENT_EMAIL_DOMAIN` set to the real student email domain.
5. Run `pnpm db:migrate` once against the production `DATABASE_URL` (from
   your machine, pointed at the Neon connection string) before the first
   deploy goes live.
6. In the GitHub repo's Settings → Secrets and variables → Actions, add
   `APP_URL` (your Vercel deployment URL) and `CRON_SECRET` (matching the
   value in Vercel) so `.github/workflows/notify-cron.yml` can call the
   notification endpoint on schedule.
7. Sign up once in production to create your Super Admin, then follow "First
   run" above.
