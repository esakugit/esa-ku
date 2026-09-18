/**
 * Database client — smart driver selection for dev vs production.
 *
 * PRODUCTION (Vercel + Neon):
 *   Uses @neondatabase/serverless HTTP driver. This is the ONLY reliable
 *   driver for Vercel Serverless Functions: it sends queries over HTTPS
 *   instead of a persistent TCP socket, avoiding ETIMEDOUT / connection
 *   exhaustion that kills the `pg` driver on Neon.
 *
 * DEVELOPMENT (local Postgres):
 *   Uses node-postgres (`pg`) over a plain TCP connection pool.
 *
 * Selection is automatic — no config needed:
 *   - neon.tech in DATABASE_URL  → always use Neon HTTP driver
 *   - NODE_ENV === "production"  → always use Neon HTTP driver
 *   - Everything else            → use local pg pool
 */

import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString: string =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:5432/esa_platform_dev";

function shouldUseNeon(url: string): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    /neon\.tech/.test(url) ||
    /neon-pooler/.test(url)
  );
}

// ─── Build the db client synchronously at module load ─────────────────────

function buildDb() {
  if (shouldUseNeon(connectionString)) {
    // Neon serverless HTTP driver — no TCP socket, works on Vercel.
    const sql = neon(connectionString);
    return drizzleNeon(sql, { schema });
  } else {
    // Local dev — standard node-postgres pool.
    const pool = new Pool({
      connectionString,
      ssl: false,
      max: 10,
    });
    return drizzlePg(pool, { schema });
  }
}

// ─── Singleton (dev hot-reload safe) ──────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __esa_db: ReturnType<typeof buildDb> | undefined;
}

export const db: ReturnType<typeof buildDb> =
  (process.env.NODE_ENV !== "production" && globalThis.__esa_db) || buildDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__esa_db = db;
}

export type Database = typeof db;
