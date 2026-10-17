// Tracked public datasheet downloads.
// Datasheets are served through this route (instead of as raw static files) so
// every download is recorded. Filenames are basename-sanitised and limited to .pdf.

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { recordDownload } from '../services/downloads.js';
import { generateDatasheetPdf, renderDatasheetData } from '../services/datasheet-pdf.js';
import { buildDatasheetData, categoryTitleFor } from '../services/datasheet-product.js';
import { getProductRow, productView, SLUG_RE } from '../services/catalog.js';

export const downloadsRouter = () => {
  const router = Router();

  // GET /api/download/datasheet/generated/:slug — render a datasheet from the
  // shared HTML template + per-product JSON (server/datasheets-data/<slug>.json).
  // Result is cached on disk; renders again only when data or template change.
  router.get('/datasheet/generated/:slug', async (req, res, next) => {
    try {
      const result = await generateDatasheetPdf(String(req.params.slug || ''));
      if (!result) {
        return res.status(404).json({ error: 'Datasheet not found.' });
      }

      recordDownload({ filename: path.basename(result.file), kind: 'datasheet', ip: req.ip });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return fs.createReadStream(result.file).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/download/datasheet/product/:category/:slug — render the branded
  // LumenX datasheet for an admin-created/overridden product from its DB row.
  // The payload is hashed into the cache key, so edits regenerate automatically.
  router.get('/datasheet/product/:category/:slug', async (req, res, next) => {
    try {
      const category = String(req.params.category || '').trim();
      const slug = String(req.params.slug || '').trim();
      if (!SLUG_RE.test(category) || !SLUG_RE.test(slug)) {
        return res.status(404).json({ error: 'Datasheet not found.' });
      }

      const row = await getProductRow(category, slug);
      if (!row) return res.status(404).json({ error: 'Datasheet not found.' });

      const product = productView(row, { admin: true });
      const categoryTitle = await categoryTitleFor(category);
      const data = buildDatasheetData({
        product,
        categoryTitle,
        datasheet: product.datasheet ?? null,
      });
      const result = await renderDatasheetData({ key: category + '-' + slug, data });
      if (!result) return res.status(404).json({ error: 'Datasheet not found.' });

      recordDownload({ filename: result.filename, kind: 'datasheet', ip: req.ip });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return fs.createReadStream(result.file).on('error', next).pipe(res);
    } catch (err) {
      if (String(err?.message || '').includes('Chrome') || String(err?.message || '').includes('Chromium')) {
        return res.status(503).json({ error: 'The datasheet renderer is unavailable on this server.' });
      }
      return next(err);
    }
  });

  // GET /api/download/spec-sheet/:filename — log and stream an admin-uploaded
  // product spec sheet. These live under uploads/spec-sheets, which is NOT
  // served statically, so every download is tracked and the directory cannot
  // be listed or fetched directly.
  router.get('/spec-sheet/:filename', (req, res, next) => {
    try {
      const base = path.basename(String(req.params.filename || ''));
      if (!base.toLowerCase().endsWith('.pdf')) {
        return res.status(404).json({ error: 'Spec sheet not found.' });
      }

      const filePath = path.join(config.uploadsDir, 'spec-sheets', base);
      const root = path.join(config.uploadsDir, 'spec-sheets') + path.sep;
      if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Spec sheet not found.' });
      }

      recordDownload({ filename: base, kind: 'datasheet', ip: req.ip });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${base}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(filePath).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/download/datasheet/:filename — log and stream a public PDF.
  router.get('/datasheet/:filename', (req, res, next) => {
    try {
      const base = path.basename(String(req.params.filename || ''));
      if (!base.toLowerCase().endsWith('.pdf')) {
        return res.status(404).json({ error: 'Datasheet not found.' });
      }

      const filePath = path.join(config.datasheetsDir, base);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Datasheet not found.' });
      }

      // Record (anonymous by IP — public file, no login required).
      recordDownload({ filename: base, kind: 'datasheet', ip: req.ip });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${base}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(filePath).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
