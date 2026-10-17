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

-- Which photometric file belongs to which catalogue product.
--
-- This table is the source of truth for the per-product IES downloads. The
-- committed frontend map (`src/ies-product-map.ts`) is a build artefact
-- generated from it by `scripts/generate-ies-product-map.mjs` (`npm run
-- ies:map`) rather than being edited by hand, and the admin "IES files" tab
-- writes here through POST /api/admin/ies/upload.
--
-- One file belongs to exactly one product (the UNIQUE index on `filename`), so
-- a file cannot be offered under two luminaires; re-assigning moves it.
CREATE TABLE IF NOT EXISTS ies_product_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug  TEXT NOT NULL,
  category_slug TEXT,
  filename      TEXT NOT NULL,
  original_name TEXT,
  bytes         INTEGER,
  source        TEXT NOT NULL DEFAULT 'upload',  -- 'upload' | 'import'
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- Editable site copy ("Content" tab in /admin). A single-row JSONB document
-- holds the live copy; every save snapshots the previous document into
-- content_revisions so a mistake is one click from being undone.
CREATE TABLE IF NOT EXISTS site_content (
  id         INT PRIMARY KEY DEFAULT 1,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS content_revisions_created_idx ON content_revisions (created_at DESC);

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

-- One IES file serves one product; the generator and the admin UI both rely on
-- this (see the table comment above).
CREATE UNIQUE INDEX IF NOT EXISTS ies_product_files_filename_idx ON ies_product_files (filename);
CREATE INDEX IF NOT EXISTS ies_product_files_product_idx         ON ies_product_files (product_slug);

-- ── Editable catalogue overlay ──────────────────────────────────────────────
--
-- The published catalogue is still built in code (src/catalogue-scraped.ts,
-- src/catalogue-full.ts and src/official-products.ts). These tables hold only
-- admin-created categories/products and overrides for catalogue entries, keyed
-- by slug. The SPA merges them over the static catalogue at runtime, exactly
-- like site_content is merged over the hardcoded copy. Nothing here duplicates
-- the 100+ base products unless an admin has actually edited one.

-- Admin-created categories, or overrides of a base category (same id).
CREATE TABLE IF NOT EXISTS catalog_categories (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  applications    TEXT NOT NULL DEFAULT '',
  image_url       TEXT,
  link_label      TEXT NOT NULL DEFAULT 'View Range',
  category_range  TEXT NOT NULL DEFAULT 'lighting',  -- 'lighting' | 'sensors'
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by      TEXT
);

-- One row per admin-created product or base-product override.
--
-- pdf_source: 'none' | 'uploaded' | 'generated'. When 'generated', pdf_url is
-- the tracked LumenX datasheet route and the datasheet JSONB drives the render.
-- images is ProductImage[]: { src, alt, fit, width, height }.
CREATE TABLE IF NOT EXISTS catalog_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         TEXT NOT NULL,
  slug                TEXT NOT NULL,
  name                TEXT NOT NULL,
  summary             TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  specs               JSONB NOT NULL DEFAULT '[]'::jsonb,
  features            JSONB NOT NULL DEFAULT '[]'::jsonb,
  applications        JSONB NOT NULL DEFAULT '[]'::jsonb,
  images              JSONB NOT NULL DEFAULT '[]'::jsonb,
  main_image          TEXT,
  pdf_url             TEXT,
  pdf_name            TEXT,
  pdf_source          TEXT NOT NULL DEFAULT 'none',
  -- Public visibility toggle. Hidden products stay in the admin and in the
  -- overlay so they can be restored, but are filtered from every public page,
  -- datasheet library and sitemap.
  published           BOOLEAN NOT NULL DEFAULT true,
  warranty            TEXT,
  brand               TEXT,
  manufacturer        TEXT,
  manufacturer_model  TEXT,
  datasheet           JSONB,
  source_import_id    UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by          TEXT,
  UNIQUE (category_id, slug)
);

-- Idempotent backfill for databases created before the visibility toggle.
ALTER TABLE catalog_products
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

-- AI spec-sheet import jobs. The source PDF lives under uploads/manufacturer-specs
-- and is intentionally never served publicly.
CREATE TABLE IF NOT EXISTS catalog_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path     TEXT NOT NULL,                    -- relative to UPLOADS_DIR
  original_name   TEXT,
  bytes           INTEGER,
  page_count      INTEGER,
  status          TEXT NOT NULL DEFAULT 'queued',   -- queued|extracting|analyzing|ready|failed|canceled
  status_message  TEXT,
  model           TEXT,
  category_ids    JSONB NOT NULL DEFAULT '[]'::jsonb,
  page_hint       TEXT,
  model_hint      TEXT,
  result          JSONB,
  raw_response    TEXT,
  images          JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings        JSONB NOT NULL DEFAULT '[]'::jsonb,
  error           TEXT,
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The FK is added after both tables exist, so a partially seeded database can
-- still run this schema idempotently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'catalog_products_source_import_fk'
  ) THEN
    ALTER TABLE catalog_products
      ADD CONSTRAINT catalog_products_source_import_fk
      FOREIGN KEY (source_import_id) REFERENCES catalog_imports(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS catalog_products_category_idx ON catalog_products (category_id, name);
CREATE INDEX IF NOT EXISTS catalog_categories_order_idx   ON catalog_categories (sort_order, title);
CREATE INDEX IF NOT EXISTS catalog_imports_created_idx    ON catalog_imports (created_at DESC);
CREATE INDEX IF NOT EXISTS catalog_imports_status_idx     ON catalog_imports (status);
