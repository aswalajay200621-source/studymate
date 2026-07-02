/**
 * Runs CREATE TABLE IF NOT EXISTS DDL for every table in the schema.
 * Called at API server startup with retry + lazy fallback on first request.
 */
import { pool } from "./index";

const DDL = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS users (
    id                VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR UNIQUE,
    password_hash     VARCHAR,
    first_name        VARCHAR,
    last_name         VARCHAR,
    profile_image_url VARCHAR,
    college           VARCHAR DEFAULT 'CSE',
    year              VARCHAR DEFAULT '1',
    role              VARCHAR DEFAULT 'student',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS semesters (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    college     TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    code        TEXT NOT NULL,
    semester    INTEGER NOT NULL DEFAULT 1,
    semester_id TEXT REFERENCES semesters(id) ON DELETE SET NULL,
    college     TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color       TEXT NOT NULL DEFAULT '#4361EE',
    icon        TEXT NOT NULL DEFAULT 'book',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id           TEXT PRIMARY KEY,
    subject_id   TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    content_html TEXT NOT NULL DEFAULT '',
    summary      TEXT NOT NULL DEFAULT '',
    order_index  INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id          SERIAL PRIMARY KEY,
    chapter_id  TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id            SERIAL PRIMARY KEY,
    chapter_id    TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    question      TEXT NOT NULL,
    options       JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation   TEXT NOT NULL DEFAULT '',
    order_index   INTEGER NOT NULL DEFAULT 0
  );
`;

let migrationDone = false;

async function attemptMigration(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(DDL);
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log("[db] Tables ready:", rows.map((r: any) => r.table_name).join(", "));
    migrationDone = true;
  } finally {
    client.release();
  }
}

/** Startup migration: retries up to 8 times with exponential backoff (max ~2 min total). */
export async function runMigrations(): Promise<void> {
  const maxAttempts = 8;
  let delay = 2000; // start at 2 s

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await attemptMigration();
      return;
    } catch (err: any) {
      if (attempt === maxAttempts) {
        console.error(`[db] Migration failed after ${maxAttempts} attempts:`, err.message);
        return; // non-fatal — lazy migration will handle it on first request
      }
      console.warn(`[db] Migration attempt ${attempt} failed (${err.message}), retrying in ${delay / 1000}s…`);
      await new Promise((res) => setTimeout(res, delay));
      delay = Math.min(delay * 1.8, 30_000); // cap at 30 s
    }
  }
}

/**
 * Lazy migration guard — call this at the top of any route handler.
 * If the startup migration already succeeded this is a no-op (single flag check).
 * If it failed, this will attempt the migration now (DB is likely reachable by request time).
 */
export async function ensureMigrated(): Promise<void> {
  if (migrationDone) return;
  await attemptMigration();
}
