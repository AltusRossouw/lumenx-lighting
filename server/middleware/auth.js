// Authentication & authorisation middleware (functional — higher-order functions).
//
//   requireAuth   -> user must be logged in                  (401 otherwise)
//   requireAdmin  -> admin key header OR a session admin role (403 otherwise)

import { config } from '../config.js';
import { queryOne } from '../db.js';
import { decodeToken } from '../services/token.js';

// Extract the session user id from the request cookie (no DB hit).
export const getSessionUserId = (req) => {
  const raw = req.cookies?.[config.cookieName];
  if (!raw) return null;
  const payload = decodeToken(raw);
  return payload && typeof payload.sub === 'string' ? payload.sub : null;
};

// Load the full user row (id, email, role) for the current session.
export const loadSessionUser = async (req) => {
  const id = getSessionUserId(req);
  if (!id) return null;
  return queryOne(
    'SELECT id, email, role FROM users WHERE id = $1',
    [id],
  );
};

export const requireAuth = async (req, res, next) => {
  try {
    const user = await loadSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

// Admin gate — allows EITHER the shared admin key (header, for scripts/CLI) OR a
// signed-in account whose role is 'admin' (the CEO's browser login).
export const requireAdmin = async (req, res, next) => {
  try {
    const key = req.get('x-admin-key') || '';
    if (config.adminApiKey && key === config.adminApiKey) {
      return next();
    }

    const user = await loadSessionUser(req);
    if (user && user.role === 'admin') {
      req.user = user;
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: admin access required.' });
  } catch (err) {
    return next(err);
  }
};
