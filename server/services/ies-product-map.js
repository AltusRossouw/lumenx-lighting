// Product → IES photometry assignments, persisted in PostgreSQL.
//
// This service is the single source of truth for which photometric file belongs
// to which catalogue product:
//
//   * the admin "IES files" tab reads and writes it through /api/admin/ies*,
//   * GET /api/ies/product-map serves it to the frontend at runtime,
//   * `scripts/generate-ies-product-map.mjs` (`npm run ies:map`) renders the
//     committed build artefact `src/ies-product-map.ts` from it, so that file is
//     never hand-edited.
//
// Naming convention: uploads are renamed on the way in to match the files the
// supplier import produced — lowercase, `lumenx-` prefixed, non-alphanumerics
// collapsed to `-` — because the walled-garden allowlist in services/ies.js
// (`isIesFilename`) only serves `lumenx-*.ies` / `orbitx-*.ies`.

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { query } from '../db.js';

// ── Naming ────────────────────────────────────────────────────────────────

/**
 * Human-readable reason for a thrown value.
 *
 * A refused database connection surfaces as an AggregateError with an empty
 * `message`, which would otherwise print as "failed: " with no explanation.
 */
export const describeError = (err) => {
  if (!err) return 'unknown error';
  if (err.message) return err.message;
  if (err.code) return `${err.code}${err.address ? ` (${err.address}:${err.port})` : ''}`;
  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors.map((inner) => inner?.message || inner?.code || String(inner)).join('; ');
  }
  return String(err);
};

/** Lowercase, dash-separated slug — the same rule the supplier import used. */
export const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Brand markers that are stripped before the canonical `lumenx-` prefix is
// applied: the client's delivery arrives as `PioLED_…` / `LumenX_…`, and
// re-prefixing those would produce `lumenx-pioled-…` / `lumenx-lumenx-…`.
const FOREIGN_BRAND_PREFIX = /^(pioled|lumenx|luminex)[_-]+/i;

/**
 * Canonical filename for an uploaded file:
 *   `PioLED_3000K 10W Sauron Downlight.IES` → `lumenx-3000k-10w-sauron-downlight.ies`
 * Returns null when nothing nameable is left.
 */
export const iesFilenameForUpload = (originalName) => {
  const stem = String(originalName ?? '')
    .replace(/\.ies$/i, '')
    .replace(FOREIGN_BRAND_PREFIX, '');
  const slug = slugify(stem);
  return slug ? `lumenx-${slug}.ies` : null;
};

// ── Content validation ────────────────────────────────────────────────────

const MAX_IES_BYTES = 5 * 1024 * 1024;

/**
 * A structurally plausible LM-63 file. Deliberately not the strict
 * `[MANUFAC] LumenX` test from services/ies.js: the supplier's own files carry
 * `[MANUFAC] PioLED` (or none at all), and rejecting those would block the very
 * files the client needs to publish.
 */
export const looksLikeIes = (text) => {
  const head = String(text ?? '').slice(0, 4096);
  return /IESNA|LM-63|TILT\s*=/i.test(head);
};

/** Validate an upload body. Returns { ok, error } — never throws on bad input. */
export const validateIesUpload = (body) => {
  if (!Buffer.isBuffer(body) || body.length === 0) {
    return { ok: false, error: 'No file content received.' };
  }
  if (body.length > MAX_IES_BYTES) {
    return { ok: false, error: `File is larger than ${MAX_IES_BYTES / 1024 / 1024} MB.` };
  }
  // LM-63 is a text format; decode leniently so a stray byte cannot 500.
  const text = body.toString('utf8');
  if (!looksLikeIes(text)) {
    return { ok: false, error: 'That does not look like an IES (LM-63) file.' };
  }
  return { ok: true, text };
};

// ── Disk helpers ──────────────────────────────────────────────────────────

/**
 * Both IES roots: the committed/importer directory and the writable uploads
 * directory. Committed files win when a name exists in both.
 */
const iesRoots = () => [...new Set([config.iesDir, config.iesUploadsDir].filter(Boolean))];

/** Filenames present across both IES roots (empty when neither exists). */
export const listIesDirFilenames = async () => {
  const names = new Set();
  for (const dir of iesRoots()) {
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        if (entry.toLowerCase().endsWith('.ies')) names.add(entry);
      }
    } catch {
      // Missing directory is not an error.
    }
  }
  return [...names].sort();
};

/**
 * Write an uploaded file into the writable IES directory (uploads/ies) and
 * return its canonical filename.
 *
 * Committed files in server/files/ies stay read-only. Re-uploading the same
 * bytes is idempotent: if either root already has those bytes under a candidate
 * name, that name is reused. Different bytes under the same name are never
 * overwritten — a `-2`, `-3`, … suffix keeps both files.
 */
export const writeIesFile = async (originalName, body) => {
  const base = iesFilenameForUpload(originalName);
  if (!base) {
    throw Object.assign(new Error('Cannot derive a filename from that upload.'), { status: 400 });
  }

  await fs.mkdir(config.iesUploadsDir, { recursive: true });
  const roots = iesRoots();

  const candidates = [
    base,
    ...Array.from({ length: 50 }, (_, i) => base.replace(/\.ies$/, `-${i + 2}.ies`)),
  ];
  for (const candidate of candidates) {
    let conflict = false;
    for (const dir of roots) {
      let existing = null;
      try {
        existing = await fs.readFile(path.join(dir, candidate));
      } catch {
        existing = null;
      }
      if (existing === null) continue;
      if (existing.equals(body)) return { filename: candidate, reused: true };
      conflict = true;
      break;
    }
    if (conflict) continue;

    await fs.writeFile(path.join(config.iesUploadsDir, candidate), body);
    return { filename: candidate, reused: false };
  }
  throw Object.assign(new Error('Too many files with that name already exist.'), { status: 409 });
};

// ── Database ──────────────────────────────────────────────────────────────

const assignmentView = (row) => ({
  id: row.id,
  productSlug: row.product_slug,
  categorySlug: row.category_slug,
  filename: row.filename,
  originalName: row.original_name,
  bytes: row.bytes,
  source: row.source,
  uploadedBy: row.uploaded_by,
  createdAt: row.created_at,
});

/** Every assignment, ordered for a stable generated map. */
export const listIesAssignments = async () => {
  const result = await query(
    `SELECT id, product_slug, category_slug, filename, original_name, bytes, source,
            uploaded_by, created_at
     FROM ies_product_files
     ORDER BY product_slug, filename`,
  );
  return result.rows.map(assignmentView);
};

/**
 * Attach a file to a product. A file belongs to one product only, so moving it
 * re-points the existing row instead of creating a second one.
 */
export const assignIesFile = async ({
  productSlug,
  categorySlug = null,
  filename,
  originalName = null,
  bytes = null,
  source = 'upload',
  uploadedBy = null,
}) => {
  const result = await query(
    `INSERT INTO ies_product_files
       (product_slug, category_slug, filename, original_name, bytes, source, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (filename) DO UPDATE
       SET product_slug  = EXCLUDED.product_slug,
           category_slug = EXCLUDED.category_slug,
           original_name = COALESCE(EXCLUDED.original_name, ies_product_files.original_name),
           bytes         = COALESCE(EXCLUDED.bytes, ies_product_files.bytes),
           source        = EXCLUDED.source,
           uploaded_by   = COALESCE(EXCLUDED.uploaded_by, ies_product_files.uploaded_by)
     RETURNING id, product_slug, category_slug, filename, original_name, bytes, source,
               uploaded_by, created_at`,
    [productSlug, categorySlug, filename, originalName, bytes, source, uploadedBy],
  );
  return assignmentView(result.rows[0]);
};

/** Detach one file from its product. Returns the number of rows removed. */
export const unassignIesFile = async (filename) => {
  const result = await query('DELETE FROM ies_product_files WHERE filename = $1', [filename]);
  return result.rowCount;
};

/** Assignments whose file is no longer in the IES directory. */
export const listMissingAssignments = async (presentFilenames) => {
  const present = new Set(presentFilenames);
  const rows = await listIesAssignments();
  return rows.filter((row) => !present.has(row.filename));
};

/**
 * The product → filenames map, containing only files that actually exist on
 * disk so a generated download link can never 404.
 *
 * Keyed by product slug: `iesFilesForProduct(slug)` in the SPA has no category
 * argument, so two catalogue entries that share a slug (ACE and Thermisto each
 * exist under both `highbays` and `linears`) share their photometry. The
 * generator flags those slugs rather than hiding them.
 */
export const buildProductMap = async () => {
  const [assignments, filenames] = await Promise.all([listIesAssignments(), listIesDirFilenames()]);
  const present = new Set(filenames);

  const map = {};
  const missing = [];
  const ambiguous = new Map();

  for (const row of assignments) {
    if (!present.has(row.filename)) {
      missing.push(row);
      continue;
    }
    (map[row.productSlug] ||= []).push(row.filename);
    if (row.categorySlug) {
      const categories = ambiguous.get(row.productSlug) ?? new Set();
      categories.add(row.categorySlug);
      ambiguous.set(row.productSlug, categories);
    }
  }

  for (const slug of Object.keys(map)) {
    map[slug] = [...new Set(map[slug])].sort();
  }

  return {
    map,
    missing,
    ambiguous: [...ambiguous.entries()]
      .filter(([, categories]) => categories.size > 1)
      .map(([slug, categories]) => ({ slug, categories: [...categories].sort() })),
    files: Object.values(map).reduce((total, list) => total + list.length, 0),
  };
};

/**
 * Admin view: every file in the walled garden with the product it is attached
 * to (or null), plus the per-product grouping. Files on disk but unassigned are
 * listed so the admin can see what has not been published yet.
 */
export const listIesLibrary = async () => {
  const [assignments, filenames] = await Promise.all([listIesAssignments(), listIesDirFilenames()]);
  const byFilename = new Map(assignments.map((row) => [row.filename, row]));

  const files = filenames.map((filename) => {
    const row = byFilename.get(filename) ?? null;
    return {
      filename,
      assigned: row !== null,
      productSlug: row ? row.productSlug : null,
      categorySlug: row ? row.categorySlug : null,
      originalName: row ? row.originalName : null,
      source: row ? row.source : null,
      uploadedBy: row ? row.uploadedBy : null,
      createdAt: row ? row.createdAt : null,
    };
  });

  // Assignments whose file has gone missing are surfaced, not hidden.
  const orphans = assignments
    .filter((row) => !filenames.includes(row.filename))
    .map((row) => ({ ...row, assigned: true, missing: true }));

  return { files: [...files, ...orphans], assignments };
};
