/**
 * One-shot migration: creates all StudyMate tables if they don't exist.
 * Run with: node scripts/migrate.cjs
 * Uses the same Supabase connection that the API server uses at runtime.
 */
const { Pool } = require("pg");

const DB_URL =
  process.env.SUPABASE_DATABASE_URL ||
  "postgresql://postgres:aswalbenitta@db.vkhumixpqpqljfjegtle.supabase.co:5432/postgres";

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const DDL = `
-- extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users
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

-- semesters
CREATE TABLE IF NOT EXISTS semesters (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  college     TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- subjects
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

-- chapters
CREATE TABLE IF NOT EXISTS chapters (
  id           TEXT PRIMARY KEY,
  subject_id   TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  summary      TEXT NOT NULL DEFAULT '',
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id          SERIAL PRIMARY KEY,
  chapter_id  TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- quiz_questions
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

async function run() {
  console.log("Connecting to Supabase...");
  const client = await pool.connect();
  try {
    console.log("Running migrations...");
    await client.query(DDL);
    console.log("✓ All tables created (or already exist)");

    // verify
    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log("Tables in DB:", rows.map((r) => r.table_name).join(", "));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
