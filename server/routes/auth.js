// Authentication routes: register, login, logout, me.
// Functional composition — each handler is a plain async function.

import { Router } from 'express';
import { queryOne } from '../db.js';
import { config } from '../config.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { signToken, cookieOptions } from '../services/token.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidEmail, isValidPassword, normalizeEmail } from '../middleware/validation.js';

const publicUser = (row) =>
  row ? { id: row.id, email: row.email, role: row.role } : null;

export const authRouter = () => {
  const router = Router();

  // POST /api/auth/register — create an account (self-serve, no approval).
  router.post('/register', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password;

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }
      if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await hashPassword(password);
      const inserted = await queryOne(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, role`,
        [email, passwordHash],
      );

      // Never return the hash.
      return res.status(201).json({
        user: publicUser(inserted),
        message: 'Account created. You can now sign in and download photometric files.',
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/login — verify credentials and set the session cookie.
  router.post('/login', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password ?? '';

      const row = await queryOne(
        'SELECT id, email, password_hash, role FROM users WHERE email = $1',
        [email],
      );
      if (!row) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const ok = await verifyPassword(password, row.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signToken({ sub: row.id, email: row.email });
      res.cookie(config.cookieName, token, cookieOptions());

      return res.json({ user: publicUser(row) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/admin-login — sign in ONLY if the account has the admin role.
  router.post('/admin-login', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password ?? '';

      const row = await queryOne(
        'SELECT id, email, password_hash, role FROM users WHERE email = $1',
        [email],
      );
      if (!row) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const ok = await verifyPassword(password, row.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (row.role !== 'admin') {
        return res.status(403).json({ error: 'This account is not an administrator.' });
      }

      const token = signToken({ sub: row.id, email: row.email });
      res.cookie(config.cookieName, token, cookieOptions());

      return res.json({ user: publicUser(row) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/logout — clear the session cookie.
  router.post('/logout', (_req, res) => {
    res.clearCookie(config.cookieName, { path: '/' });
    return res.json({ ok: true });
  });

  // GET /api/auth/me — the current session's user (or 401).
  router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

  return router;
};
