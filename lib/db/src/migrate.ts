/**
 * Runs CREATE TABLE IF NOT EXISTS DDL for every table in the schema.
 * Called once at API server startup — safe to re-run, purely additive.
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

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(DDL);
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log("[db] Tables ready:", rows.map((r: any) => r.table_name).join(", "));
  } catch (err: any) {
    console.error("[db] Migration error:", err.message);
    // Non-fatal — server continues; routes will return 503 if DB is unreachable
  } finally {
    client.release();
  }
}
