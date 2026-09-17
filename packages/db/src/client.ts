import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Standard Postgres wire-protocol connection via `pg` — works unchanged
 * against a local Postgres in development and against Neon in production
 * (Neon's pooled connection string is a normal postgres:// URL). One driver,
 * one code path, no dev/prod split to maintain.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to apps/web/.env.local and fill in a Postgres connection string (local Postgres in dev, Neon in production).",
    );
  }
  return url;
}

// Neon's pooled endpoint (and most managed Postgres) requires TLS; a plain
// local Postgres does not speak TLS by default. Toggle based on the URL so
// the same code works in both places without extra config.
function wantsSsl(url: string): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return (
    /sslmode=require/.test(url) ||
    /neon\.tech/.test(url) ||
    /supabase\./.test(url) ||
    /render\.com/.test(url) ||
    /railway\.app/.test(url) ||
    /pooler\.supabase\.com/.test(url)
  );
}

const connectionString = getDatabaseUrl();

declare global {
  // eslint-disable-next-line no-var
  var __esa_pg_pool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __esa_drizzle_db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const pool =
  globalThis.__esa_pg_pool ??
  new Pool({
    connectionString,
    ssl: wantsSsl(connectionString) ? { rejectUnauthorized: false } : false,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__esa_pg_pool = pool;
}

export const db = globalThis.__esa_drizzle_db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__esa_drizzle_db = db;
}

export type Database = typeof db;
