import fs from "fs";
try {
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  } else if (fs.existsSync("../../.env")) {
    process.loadEnvFile("../../.env");
  }
} catch (e) {}

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. Did you forget to configure the database?",
  );
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_MAX_CONNECTIONS ?? "10", 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
