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

// Writable media root. In production this is a mounted Docker volume
// (/app/uploads); locally it sits beside the repo as ./uploads (gitignored).
// Public product/category images are served from here, but spec sheets, source
// PDFs and IES uploads are only ever streamed through their own routes.
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'));

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
  // Committed/importer files live in server/files/ies; admin uploads land in
  // uploads/ies, which is a persistent Docker volume.
  iesDir: path.resolve(process.env.IES_DIR || path.join(__dirname, 'files', 'ies')),
  iesUploadsDir: path.resolve(process.env.IES_UPLOADS_DIR || path.join(uploadsDir, 'ies')),

  // Writable media root (product/category images, spec sheets, source PDFs).
  uploadsDir,

  // Public datasheets — served through the backend so downloads can be tracked.
  datasheetsDir: path.resolve(__dirname, '..', 'public', 'datasheets'),

  // DeepSeek AI spec-sheet import. Disabled automatically when no key is set.
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, ''),
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
  aiImportEnabled: toBool(process.env.AI_IMPORT_ENABLED, true),

  // CORS origins allowed for the API (dev convenience; same-origin in prod).
  corsOrigins: splitList(process.env.CORS_ORIGINS, 'http://localhost:3000'),

  // Static frontend build directory (served in production).
  clientDistDir: path.resolve(__dirname, '..', 'dist'),

  // Public site URL (canonical links, email footers).
  publicUrl: process.env.PUBLIC_URL || 'https://www.lumenx.co.za',

  // Transactional email (Resend). Notifications are skipped when no API key.
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || 'LumenX Lighting <leads@lumenx.co.za>',
  leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL || 'info@lumenx.co.za',

  // Rate limiting
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 200),
});
