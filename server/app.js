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
import { catalogAdminRouter, catalogPublicRouter } from './routes/catalog.js';
import { catalogImportRouter } from './routes/catalog-imports.js';
import { listCatalog } from './services/catalog.js';
import { iesRouter } from './routes/ies.js';
import { designRouter } from './routes/design.js';
import { downloadsRouter } from './routes/downloads.js';
import { plannerRouter } from './routes/planner.js';
import { quoteRouter } from './routes/quote.js';
import { contactRouter } from './routes/contact.js';
import { contentRouter } from './routes/content.js';

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

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", 'https://umami.intellixlabs.co.za'],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          connectSrc: ["'self'", 'https://umami.intellixlabs.co.za'],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );
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
  // The catalogue overlay has its own admin router so it does not grow
  // server/routes/admin.js into a second monolith.
  app.use('/api', catalogPublicRouter());
  app.use('/api/admin/catalog/imports', catalogImportRouter());
  app.use('/api/admin/catalog', catalogAdminRouter());
  app.use('/api/admin', adminRouter());
  app.use('/api', contentRouter());
  app.use('/api/ies', iesRouter());
  app.use('/api/design', designRouter());
  app.use('/api/download', downloadsRouter());
  app.use('/api/planner', plannerRouter());
  app.use('/api/quote', quoteRouter());
  app.use('/api/contact', contactRouter());

  app.use('/api', notFoundHandler);

  // Admin-uploaded product/category images. Only these two subdirectories are
  // public: spec sheets, manufacturer source PDFs and uploaded IES files are
  // streamed through their own tracked or authenticated routes.
  app.use(
    '/uploads/products',
    express.static(path.join(config.uploadsDir, 'products'), { maxAge: '30d', immutable: true, index: false }),
  );
  app.use('/uploads/products', (_req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(
    '/uploads/categories',
    express.static(path.join(config.uploadsDir, 'categories'), { maxAge: '30d', immutable: true, index: false }),
  );
  app.use('/uploads/categories', (_req, res) => res.status(404).json({ error: 'Not found.' }));
  // Nothing else under /uploads is public. This explicit 404 stops the SPA
  // fallback from answering private paths (spec sheets, source PDFs, IES) with
  // index.html and a misleading 200.
  app.use('/uploads', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  // Runtime sitemap extension: the build writes the base sitemap from the
  // static catalogue; this appends admin-created/overridden categories and
  // products so they are discoverable without a rebuild. If the built file or
  // the DB is unavailable, the static sitemap is served unchanged.
  app.get('/sitemap.xml', async (_req, res, next) => {
    const staticFile = path.join(config.clientDistDir, 'sitemap.xml');
    let xml;
    try {
      xml = await fs.promises.readFile(staticFile, 'utf8');
    } catch {
      return next();
    }

    try {
      const { categories, products } = await listCatalog();
      const visibleProducts = products.filter((product) => product.published !== false);

      // A base product hidden in the admin still appears in the build-time
      // sitemap. Remove those URLs before appending the visible overlay rows.
      for (const product of products) {
        if (product.published !== false) continue;
        const loc = config.publicUrl + '/products/' + product.category + '/' + product.slug;
        const tag = '  <url><loc>' + loc + '</loc></url>';
        xml = xml.split(tag + '\n').join('');
        xml = xml.split(tag).join('');
      }

      const existing = new Set(
        [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
      );
      const extra = [];
      for (const category of categories) {
        const loc = config.publicUrl + '/products/' + category.id;
        if (!existing.has(loc)) extra.push(loc);
      }
      for (const product of visibleProducts) {
        const loc = config.publicUrl + '/products/' + product.category + '/' + product.slug;
        if (!existing.has(loc)) extra.push(loc);
      }
      if (extra.length > 0) {
        xml = xml.replace(
          '</urlset>',
          extra.map((loc) => '  <url><loc>' + loc + '</loc></url>').join('\n') + '\n</urlset>',
        );
      }
    } catch (err) {
      console.error('[sitemap] catalogue overlay unavailable:', err.message);
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(xml);
  });

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
