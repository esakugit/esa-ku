/**
 * Database client — smart driver selection for dev vs production.
 *
 * PRODUCTION (Vercel + Neon):
 *   Uses @neondatabase/serverless HTTP driver when connecting to Neon.
 *   This is the only reliable driver for Vercel Serverless Functions:
 *   it sends queries over stateless HTTPS instead of persistent TCP sockets,
 *   preventing connection pool exhaustion on serverless.
 *
 * DEVELOPMENT (local Postgres):
 *   Uses node-postgres (`pg`) over a standard local TCP connection pool.
 */

import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString: string =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "postgresql://postgres:postgres@localhost:5432/esa_platform_dev";

function isNeonUrl(url: string): boolean {
  return /neon\.tech|neon-pooler|vercel-storage\.com/.test(url);
}

function buildDb() {
  if (isNeonUrl(connectionString)) {
    // Strip parameters that Neon HTTP driver doesn't support
    // (e.g. channel_binding=require added by some Vercel Neon connection strings)
    let url = connectionString;
    try {
      const parsed = new URL(url);
      parsed.searchParams.delete("channel_binding");
      url = parsed.toString();
    } catch {
      // Keep original URL if parse fails
    }
    const sql = neon(url);
    return drizzleNeon(sql, { schema });
  }

  // Local dev / non-Neon — dynamically require pg so Vercel bundler doesn't choke
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  const { drizzle: drizzlePg } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");

  const pool = new Pool({
    connectionString,
    ssl: /sslmode=require/.test(connectionString) ? { rejectUnauthorized: false } : false,
    max: 10,
  });
  return drizzlePg(pool, { schema });
}

type DbInstance = ReturnType<typeof buildDb>;

declare global {
  // eslint-disable-next-line no-var
  var __esa_db: DbInstance | undefined;
}

export const db: DbInstance =
  (process.env.NODE_ENV !== "production" && globalThis.__esa_db) || buildDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__esa_db = db;
}

export type Database = typeof db;
