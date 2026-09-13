/**
 * One-off migration runner: `pnpm db:migrate`.
 * Applies every migration in ./migrations that hasn't run yet, tracked in a
 * `__drizzle_migrations` table Drizzle manages for you.
 */
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — copy .env.example to apps/web/.env.local and fill it in.");
  }

  const ssl = /sslmode=require/.test(url) || /neon\.tech/.test(url) ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString: url, ssl });
  const db = drizzle(pool);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
