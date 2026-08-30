// LumenX backend configuration.
// Functional, dependency-light: a single frozen config object derived from the
// environment. No classes, no side effects beyond reading process.env.

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || value === '1';
};

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const splitList = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = Object.freeze({
  // Network — bind to localhost by default; nginx reverse-proxies public traffic.
  host: process.env.HOST || '127.0.0.1',
  port: toInt(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',

  // PostgreSQL
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://localhost:5432/lumenx',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'insecure-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'lumenx_session',
  cookieSecure: toBool(process.env.COOKIE_SECURE, false),
  // Manual admin approval is performed by a human holding this key.
  adminApiKey: process.env.ADMIN_API_KEY || '',

  // IES walled garden — protected directory (never served as static files).
  iesDir: path.resolve(process.env.IES_DIR || path.join(__dirname, 'files', 'ies')),

  // Public datasheets — served through the backend so downloads can be tracked.
  datasheetsDir: path.resolve(__dirname, '..', 'public', 'datasheets'),

  // CORS origins allowed for the API (dev convenience; same-origin in prod).
  corsOrigins: splitList(process.env.CORS_ORIGINS, 'http://localhost:3000'),

  // Static frontend build directory (served in production).
  clientDistDir: path.resolve(__dirname, '..', 'dist'),

  // Public site URL (canonical links, email footers).
  publicUrl: process.env.PUBLIC_URL || 'https://www.lumenx.co.za',

  // Transactional email (Resend). Notifications are skipped when no API key.
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || 'LumenX Lighting <leads@lumenx.co.za>',
  leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL || 'projects@lumenx.co.za',

  // Rate limiting
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 200),
});
