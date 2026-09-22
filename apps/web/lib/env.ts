import { z } from "zod";

/**
 * Validates process.env once at startup so a missing/blank var fails fast
 * with a clear message instead of a confusing crash three files deep.
 */
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/esa_platform_dev"),
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters — see .env.example")
    .default("esa_platform_session_secret_for_build_min_32_chars"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Account email (spec §09) — verification + Badge decisions only.
  GMAIL_USER: z.preprocess(emptyToUndefined, z.string().email().optional()),
  GMAIL_APP_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),

  // Badge payment (spec §04, §14)
  NEXT_PUBLIC_ESA_TILL_NUMBER: z.string().default("000000"),
  NEXT_PUBLIC_ESA_TILL_NAME: z.string().default("ESA Kenyatta University"),
  NEXT_PUBLIC_ESA_BADGE_FEE: z.string().default("300"),

  // Sign-up gate (spec §14) — leave unset in dev to accept any address.
  ALLOWED_STUDENT_EMAIL_DOMAIN: z.preprocess(emptyToUndefined, z.string().optional()),

  // File storage (spec §07/§11) — "local" writes to disk for dev/self-hosting,
  // "blob" uses Vercel Blob in production.
  STORAGE_DRIVER: z.enum(["local", "blob"]).default("local"),
  BLOB_READ_WRITE_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),

  // Web Push (spec §09) — generate with `pnpm --filter web generate-vapid`.
  VAPID_PUBLIC_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  VAPID_SUBJECT: z.string().default("mailto:esa.kenyatta@gmail.com"),
  // Mirrors VAPID_PUBLIC_KEY but exposed to the browser (Next.js only inlines
  // NEXT_PUBLIC_* vars) so the push-subscribe UI can call subscribe().
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.preprocess(emptyToUndefined, z.string().optional()),

  // Shared secret the external scheduler (GitHub Actions in prod) presents
  // when calling /api/cron/notify, so the endpoint can't be triggered by
  // anyone who finds the URL.
  CRON_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  NEXT_PUBLIC_ESA_TILL_NUMBER: process.env.NEXT_PUBLIC_ESA_TILL_NUMBER,
  NEXT_PUBLIC_ESA_TILL_NAME: process.env.NEXT_PUBLIC_ESA_TILL_NAME,
  NEXT_PUBLIC_ESA_BADGE_FEE: process.env.NEXT_PUBLIC_ESA_BADGE_FEE,
  ALLOWED_STUDENT_EMAIL_DOMAIN: process.env.ALLOWED_STUDENT_EMAIL_DOMAIN,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
});
