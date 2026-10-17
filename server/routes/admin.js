// Admin routes — user management, download tracking and the IES library.
// Protected by the `x-admin-key` header OR a signed-in admin session.

import express, { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { listActivity, logActivity } from '../services/activity.js';
import {
  assignIesFile,
  buildProductMap,
  listIesLibrary,
  unassignIesFile,
  validateIesUpload,
  writeIesFile,
} from '../services/ies-product-map.js';

const adminView = (row) => ({
  id: row.id,
  email: row.email,
  role: row.role,
  created_at: row.created_at,
});

// Product slugs are URL-safe lowercase tokens (see src/types.ts `Product.slug`).
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// IES files are text; 8 MB is far above the largest real LM-63 file (~120 KB)
// while still bounding an admin-only upload.
const rawIes = express.raw({ type: () => true, limit: '8mb' });

export const adminRouter = () => {
  const router = Router();

  // Everything under /admin requires the admin key.
  router.use(requireAdmin);

  // GET /api/admin/users — list all registered accounts.
  router.get('/users', async (_req, res, next) => {
    try {
      const result = await query(
        'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC',
      );
      return res.json({ users: result.rows.map(adminView) });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/admin/activity — append-only per-user changelog. Supports
  // userId/action filters, free-text search and offset pagination.
  router.get('/activity', async (req, res, next) => {
    try {
      const userId = String(req.query.userId ?? '').trim() || null;
      if (userId && !UUID_RE.test(userId)) {
        return res.status(400).json({ error: 'A valid user id is required.' });
      }
      const page = await listActivity({
        userId,
        action: String(req.query.action ?? '').trim() || null,
        q: String(req.query.q ?? '').trim() || null,
        limit: req.query.limit,
        offset: req.query.offset,
      });
      return res.json(page);
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/admin/downloads — recent download activity (most recent first).
  router.get('/downloads', async (_req, res, next) => {
    try {
      const result = await query(
        `SELECT id, email, filename, kind, ip, created_at
         FROM downloads
         ORDER BY created_at DESC
         LIMIT 300`,
      );
      return res.json({ downloads: result.rows });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/admin/downloads/stats — totals and top files.
  router.get('/downloads/stats', async (_req, res, next) => {
    try {
      const stats = await queryOne(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE kind = 'ies')::int AS ies,
                COUNT(*) FILTER (WHERE kind = 'datasheet')::int AS datasheet
         FROM downloads`,
      );
      const top = await query(
        `SELECT filename, kind, COUNT(*)::int AS count
         FROM downloads
         GROUP BY filename, kind
         ORDER BY count DESC, filename
         LIMIT 10`,
      );
      return res.json({ stats, top: top.rows });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/admin/leads — unified inbound leads (contact form, planner quotes,
  // design-tool exports), most recent first.
  router.get('/leads', async (_req, res, next) => {
    try {
      const result = await query(
        `SELECT * FROM (
           SELECT 'contact' AS source, id, name, email, phone, company,
                  COALESCE(NULLIF(support_required, ''), NULLIF(project_name, ''), 'Contact enquiry') AS subject,
                  message AS detail, created_at
           FROM contact_requests
           UNION ALL
           SELECT 'quote' AS source, id, name, email, phone, company,
                  COALESCE(NULLIF(project->>'projectName', ''), 'Planner quote request') AS subject,
                  message AS detail, created_at
           FROM quote_requests
           UNION ALL
           SELECT 'design' AS source, id, NULL AS name, email, NULL AS phone, NULL AS company,
                  'Design tool export' AS subject,
                  NULL AS detail, created_at
           FROM design_exports
         ) leads
         ORDER BY created_at DESC
         LIMIT 300`,
      );
      return res.json({ leads: result.rows });
    } catch (err) {
      return next(err);
    }
  });

  // ── IES library ─────────────────────────────────────────────────────────
  // Attach photometry to catalogue products. Associations are stored in
  // `ies_product_files` and rendered into `src/ies-product-map.ts` by
  // `npm run ies:map`; raw files land in the walled-garden IES directory.

  // GET /api/admin/ies — every file with its product, plus the grouped map.
  router.get('/ies', async (_req, res, next) => {
    try {
      const [{ files }, productMap] = await Promise.all([listIesLibrary(), buildProductMap()]);
      return res.json({
        files,
        map: productMap.map,
        missing: productMap.missing.map((row) => row.filename),
        ambiguous: productMap.ambiguous,
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/admin/ies/upload?product=<slug>[&category=<slug>][&filename=<name>]
  // Body is the raw file. The uploaded file is renamed to the repository's
  // slugified convention and attached to `product` in one step.
  //
  // The error handler sits in the same route stack so a body-parser rejection
  // (too large, aborted) answers 413/400 rather than falling through to the
  // generic 500 handler.
  const uploadBodyError = (err, _req, res, next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'That file is larger than the 8 MB upload limit.' });
    }
    if (err?.status >= 400 && err?.status < 500) {
      return res.status(err.status).json({ error: 'The upload could not be read.' });
    }
    return next(err);
  };

  router.post('/ies/upload', rawIes, uploadBodyError, async (req, res, next) => {
    try {
      const productSlug = String(req.query.product ?? '').trim();
      const categorySlug = String(req.query.category ?? '').trim() || null;
      const originalName =
        String(req.get('x-ies-filename') ?? '').trim() || String(req.query.filename ?? '').trim();

      if (!SLUG_RE.test(productSlug)) {
        return res.status(400).json({ error: 'A valid product slug is required.' });
      }
      if (categorySlug !== null && !SLUG_RE.test(categorySlug)) {
        return res.status(400).json({ error: 'Invalid category slug.' });
      }
      if (!originalName) {
        return res.status(400).json({ error: 'The uploaded file needs a name.' });
      }
      if (!originalName.toLowerCase().endsWith('.ies')) {
        return res.status(400).json({ error: 'Only .ies files can be attached to a product.' });
      }

      const valid = validateIesUpload(req.body);
      if (!valid.ok) {
        return res.status(400).json({ error: valid.error });
      }

      const { filename, reused } = await writeIesFile(originalName, req.body);
      const assignment = await assignIesFile({
        productSlug,
        categorySlug,
        filename,
        originalName,
        bytes: req.body.length,
        source: 'upload',
        uploadedBy: req.user?.email ?? 'admin-key',
      });

      const { map, files } = await buildProductMap();
      await logActivity(req, {
        action: 'ies.upload',
        entityType: 'ies',
        entityId: filename,
        summary: `Uploaded IES file ${filename} for ${productSlug}`,
        metadata: { productSlug, categorySlug, filename, bytes: req.body.length, reused },
      });
      return res.status(reused ? 200 : 201).json({ ok: true, reused, file: assignment, map, files });
    } catch (err) {
      if (err?.status) return res.status(err.status).json({ error: err.message });
      return next(err);
    }
  });

  // POST /api/admin/ies/assign — attach a file that is already on disk.
  router.post('/ies/assign', async (req, res, next) => {
    try {
      const productSlug = String(req.body?.productSlug ?? '').trim();
      const categorySlug = String(req.body?.categorySlug ?? '').trim() || null;
      const filename = String(req.body?.filename ?? '').trim();

      if (!SLUG_RE.test(productSlug)) {
        return res.status(400).json({ error: 'A valid product slug is required.' });
      }
      if (!filename.toLowerCase().endsWith('.ies') || filename.includes('/') || filename.includes('..')) {
        return res.status(400).json({ error: 'A valid IES filename is required.' });
      }

      const { files } = await listIesLibrary();
      if (!files.some((file) => file.filename === filename)) {
        return res.status(404).json({ error: 'IES file not found.' });
      }

      const assignment = await assignIesFile({
        productSlug,
        categorySlug,
        filename,
        source: 'upload',
        uploadedBy: req.user?.email ?? 'admin-key',
      });

      const { map } = await buildProductMap();
      await logActivity(req, {
        action: 'ies.assign',
        entityType: 'ies',
        entityId: filename,
        summary: `Assigned IES file ${filename} to ${productSlug}`,
        metadata: { productSlug, categorySlug, filename },
      });
      return res.json({ ok: true, file: assignment, map });
    } catch (err) {
      return next(err);
    }
  });

  // DELETE /api/admin/ies/assign/:filename — detach (the file stays on disk).
  router.delete('/ies/assign/:filename', async (req, res, next) => {
    try {
      const filename = String(req.params.filename ?? '').trim();
      if (!filename.toLowerCase().endsWith('.ies') || filename.includes('/') || filename.includes('..')) {
        return res.status(400).json({ error: 'A valid IES filename is required.' });
      }
      const removed = await unassignIesFile(filename);
      if (removed === 0) {
        return res.status(404).json({ error: 'That file is not attached to a product.' });
      }
      const { map } = await buildProductMap();
      await logActivity(req, {
        action: 'ies.remove',
        entityType: 'ies',
        entityId: filename,
        summary: `Detached IES file ${filename}`,
        metadata: { filename, removed },
      });
      return res.json({ ok: true, removed, map });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
