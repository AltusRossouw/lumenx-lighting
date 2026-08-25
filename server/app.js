// Express app factory — assembled as a pure function. No classes.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { iesRouter } from './routes/ies.js';
import { designRouter } from './routes/design.js';
import { downloadsRouter } from './routes/downloads.js';

// Map known database errors to a clean 503 so the API never leaks internals.
const isDbError = (err) =>
  err && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === '57P01' || err.code === 'ETIMEDOUT');

const errorHandler = (err, _req, res, _next) => {
  if (isDbError(err)) {
    console.error('[db] unavailable:', err.message);
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
  console.error('[server] error:', err);
  return res.status(500).json({ error: 'Internal server error.' });
};

const notFoundHandler = (_req, res) => res.status(404).json({ error: 'Not found.' });

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Global API rate limit — a first line of defence against scrapers.
  app.use(
    '/api',
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Health probe (no DB dependency).
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'lumenx-api' }));

  app.use('/api/auth', authRouter());
  app.use('/api/admin', adminRouter());
  app.use('/api/ies', iesRouter());
  app.use('/api/design', designRouter());
  app.use('/api/download', downloadsRouter());

  app.use('/api', notFoundHandler);

  // Production: serve the built frontend from dist/ (same-origin API).
  if (fs.existsSync(config.clientDistDir)) {
    app.use(express.static(config.clientDistDir));
    // SPA fallback — only for non-API GET requests.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(config.clientDistDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
};
