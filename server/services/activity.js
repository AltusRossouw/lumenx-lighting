// Append-only per-user changelog.
//
// Logging is best-effort: a failed insert must never fail the login, download or
// admin save that produced it. Activity is admin-only and read through
// GET /api/admin/activity. Keep summaries and metadata free of secrets, raw file
// bytes and full user-submitted content.

import { query, queryOne } from '../db.js';

const MAX_SUMMARY = 500;
const MAX_ID = 200;
const MAX_UA = 300;

const clipped = (value, limit) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f]+/g, ' ')
    .trim()
    .slice(0, limit);

const activityView = (row) => ({
  id: row.id,
  userId: row.user_id || null,
  email: row.email || row.current_email || null,
  role: row.current_role || null,
  action: row.action,
  entityType: row.entity_type || null,
  entityId: row.entity_id || null,
  summary: row.summary,
  metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
  ip: row.ip || null,
  createdAt: row.created_at,
});

export const recordActivity = async ({
  userId = null,
  email = null,
  action,
  entityType = null,
  entityId = null,
  summary,
  metadata = {},
  ip = null,
  userAgent = null,
}) => {
  const safeAction = clipped(action, 80);
  if (!safeAction) return;
  try {
    await query(
      `INSERT INTO user_activity
         (user_id, email, action, entity_type, entity_id, summary, metadata, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId || null,
        clipped(email, 254) || null,
        safeAction,
        clipped(entityType, 60) || null,
        clipped(entityId, MAX_ID) || null,
        clipped(summary, MAX_SUMMARY) || safeAction,
        JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
        clipped(ip, 80) || null,
        clipped(userAgent, MAX_UA) || null,
      ],
    );
  } catch (err) {
    console.error('[activity] failed to record:', err.message);
  }
};

const requestActor = (req) => ({
  userId: req.user?.id ?? null,
  email: req.user?.email ?? (req.get?.('x-admin-key') ? 'admin-key' : null),
  ip: req.ip ?? null,
  userAgent: req.get?.('user-agent') ?? null,
});

export const logActivity = (req, fields) =>
  recordActivity({ ...requestActor(req), ...fields });

export const listActivity = async ({
  userId = null,
  action = null,
  q = null,
  limit = 50,
  offset = 0,
} = {}) => {
  const clauses = [];
  const values = [];

  if (userId) {
    values.push(userId);
    clauses.push('a.user_id = $' + values.length);
  }
  if (action) {
    values.push(action);
    clauses.push('a.action = $' + values.length);
  }
  if (q) {
    values.push('%' + q + '%');
    const n = '$' + values.length;
    clauses.push(
      `(a.summary ILIKE ${n} OR COALESCE(a.email, '') ILIKE ${n} OR COALESCE(a.entity_id, '') ILIKE ${n})`,
    );
  }

  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const totalRow = await queryOne(
    `SELECT COUNT(*)::int AS count FROM user_activity a ${where}`,
    values,
  );
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 50));
  const safeOffset = Math.max(0, Number.parseInt(String(offset), 10) || 0);
  const rows = await query(
    `SELECT a.*, u.role AS current_role, u.email AS current_email
       FROM user_activity a
       LEFT JOIN users u ON u.id = a.user_id
       ${where}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, safeLimit, safeOffset],
  );

  return {
    events: rows.rows.map(activityView),
    total: totalRow?.count ?? 0,
    limit: safeLimit,
    offset: safeOffset,
  };
};
