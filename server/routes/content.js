// Site content routes — the editable-copy CMS layer.
//
//   GET /api/content          -> current published content (public; null if never saved)
//   GET /api/admin/content    -> current content + revision history (admin)
//   PUT /api/admin/content    -> save new content, snapshotting the previous live copy (admin)
//
// The frontend owns the "defaults" (hardcoded in src/content.ts) and only the
// latest saved document is stored here. If nothing has ever been saved, the
// public endpoint returns null and the client falls back to its defaults.

import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const REVISION_LIMIT = 50;

export const contentRouter = () => {
  const router = Router();

  // Public — no auth. Returns the live document or null.
  router.get('/content', async (_req, res, next) => {
    try {
      const row = await queryOne('SELECT data FROM site_content WHERE id = 1');
      return res.json({ content: row ? row.data : null });
    } catch (err) {
      return next(err);
    }
  });

  // Admin — current document, metadata and recent revisions.
  router.get('/admin/content', requireAdmin, async (_req, res, next) => {
    try {
      const row = await queryOne(
        'SELECT data, updated_at, updated_by FROM site_content WHERE id = 1',
      );
      const revisions = await query(
        `SELECT id, created_at, created_by
         FROM content_revisions
         ORDER BY created_at DESC
         LIMIT ${REVISION_LIMIT}`,
      );
      return res.json({
        content: row ? row.data : null,
        updated_at: row ? row.updated_at : null,
        updated_by: row ? row.updated_by : null,
        revisions: revisions.rows,
      });
    } catch (err) {
      return next(err);
    }
  });

  // Admin — save. Snapshots the previous live document into content_revisions,
  // then upserts the new one.
  router.put('/admin/content', requireAdmin, async (req, res, next) => {
    try {
      const data = req.body;
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'Content must be a JSON object.' });
      }

      const by = req.user?.email ?? 'admin';
      const prev = await queryOne('SELECT data FROM site_content WHERE id = 1');
      if (prev) {
        await query(
          'INSERT INTO content_revisions (data, created_by) VALUES ($1, $2)',
          [prev.data, by],
        );
      }

      await query(
        `INSERT INTO site_content (id, data, updated_at, updated_by)
         VALUES (1, $1, now(), $2)
         ON CONFLICT (id)
         DO UPDATE SET data = EXCLUDED.data,
                       updated_at = now(),
                       updated_by = EXCLUDED.updated_by`,
        [JSON.stringify(data), by],
      );

      return res.json({ ok: true, updated_at: new Date().toISOString(), updated_by: by });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
