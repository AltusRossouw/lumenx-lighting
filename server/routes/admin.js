// Admin routes — user management and download tracking.
// Protected by the `x-admin-key` header OR a signed-in admin session.

import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const adminView = (row) => ({
  id: row.id,
  email: row.email,
  role: row.role,
  created_at: row.created_at,
});

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

  return router;
};
