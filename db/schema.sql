-- LumenX Lighting — PostgreSQL schema
-- Users (IES walled garden) and design-export email capture.

-- gen_random_uuid() lives in pgcrypto on PostgreSQL < 13.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Registered accounts (self-serve sign-up — no approval gate).
-- `role` distinguishes normal IES users ('user') from administrators ('admin').
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent backfill for databases created before the `role` column existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Account approval has been removed: sign-up is self-serve with immediate access.
ALTER TABLE users DROP COLUMN IF EXISTS is_approved;

-- Emails captured by the lighting design tool's export gate.
CREATE TABLE IF NOT EXISTS design_exports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  report     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- File download tracking. IES downloads carry user identity (the walled garden);
-- public datasheet downloads are recorded anonymously by IP.
CREATE TABLE IF NOT EXISTS downloads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  email      TEXT,
  filename   TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'ies',   -- 'ies' | 'datasheet'
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote requests from the OrbitX lighting planner.
CREATE TABLE IF NOT EXISTS quote_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  company    TEXT,
  message    TEXT,
  project    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enquiries from the main site contact form.
CREATE TABLE IF NOT EXISTS contact_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  company          TEXT,
  project_name     TEXT,
  project_type     TEXT,
  project_stage    TEXT,
  support_required TEXT,
  message          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx            ON users (email);
CREATE INDEX IF NOT EXISTS design_exports_email_idx   ON design_exports (email);
CREATE INDEX IF NOT EXISTS design_exports_created_idx ON design_exports (created_at DESC);
CREATE INDEX IF NOT EXISTS downloads_created_idx      ON downloads (created_at DESC);
CREATE INDEX IF NOT EXISTS downloads_user_idx         ON downloads (user_id);
CREATE INDEX IF NOT EXISTS downloads_kind_idx         ON downloads (kind);
CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON quote_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_email_idx   ON quote_requests (email);
CREATE INDEX IF NOT EXISTS contact_requests_created_idx ON contact_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_requests_email_idx   ON contact_requests (email);
