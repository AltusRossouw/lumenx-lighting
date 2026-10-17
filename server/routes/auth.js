// Authentication routes: register, login, logout, me.
// Functional composition — each handler is a plain async function.

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db.js';
import { config } from '../config.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { signToken, cookieOptions } from '../services/token.js';
import { sendEmail } from '../services/mail.js';
import { loadSessionUser } from '../middleware/auth.js';
import { isValidEmail, isValidPassword, normalizeEmail } from '../middleware/validation.js';
import { logActivity } from '../services/activity.js';

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

      await logActivity(req, {
        userId: inserted.id,
        email: inserted.email,
        action: 'auth.register',
        summary: 'Created an account',
      });

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

      await logActivity(req, {
        userId: row.id,
        email: row.email,
        action: 'auth.login',
        summary: 'Signed in',
      });

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

      await logActivity(req, {
        userId: row.id,
        email: row.email,
        action: 'auth.admin_login',
        summary: 'Signed in to the admin dashboard',
        metadata: { role: 'admin' },
      });

      return res.json({ user: publicUser(row) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/logout — clear the session cookie and record the sign-out.
  router.post('/logout', async (req, res, next) => {
    try {
      const user = await loadSessionUser(req);
      if (user) {
        await logActivity(req, {
          userId: user.id,
          email: user.email,
          action: 'auth.logout',
          summary: 'Signed out',
        });
      }
      res.clearCookie(config.cookieName, { path: '/' });
      return res.json({ ok: true });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/forgot-password — email a one-time reset link.
  // Always returns the same message to avoid leaking which emails are registered.
  router.post('/forgot-password', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const row = await queryOne('SELECT id, email FROM users WHERE email = $1', [email]);
      if (row) {
        const token = jwt.sign(
          { sub: row.id, purpose: 'password-reset' },
          config.jwtSecret,
          { expiresIn: '1h' },
        );
        const link = `${config.publicUrl}/reset-password?token=${encodeURIComponent(token)}`;
        await sendEmail({
          to: row.email,
          subject: 'Reset your LumenX password',
          text: `We received a request to reset your LumenX password.\n\nUse the link below (valid for 1 hour):\n${link}\n\nIf you did not request this, you can safely ignore this email.`,
          html: `<p>Reset your LumenX password using the link below (valid for 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
        });

        await logActivity(req, {
          userId: row.id,
          email: row.email,
          action: 'auth.password_reset_requested',
          summary: 'Requested a password reset',
        });
      }

      return res.json({
        message: 'If an account exists for that email, a reset link has been sent.',
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/auth/reset-password — set a new password from the emailed token.
  router.post('/reset-password', async (req, res, next) => {
    try {
      const token = req.body?.token ?? '';
      const password = req.body?.password ?? '';
      if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      let payload;
      try {
        payload = jwt.verify(token, config.jwtSecret);
      } catch {
        return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
      }
      if (payload?.purpose !== 'password-reset' || !payload.sub) {
        return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
      }

      const passwordHash = await hashPassword(password);
      const updated = await queryOne(
        'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 RETURNING id, email',
        [passwordHash, payload.sub],
      );

      if (updated) {
        await logActivity(req, {
          userId: updated.id,
          email: updated.email,
          action: 'auth.password_reset',
          summary: 'Reset the account password',
          metadata: { via: 'email_link' },
        });
      }

      return res.json({ message: 'Password updated. You can now sign in.' });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/auth/me — the current session's user (or null when signed out).
  router.get('/me', async (req, res, next) => {
    try {
      const user = await loadSessionUser(req);
      return res.json({ user: publicUser(user) });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
