// Tracked public datasheet downloads.
// Datasheets are served through this route (instead of as raw static files) so
// every download is recorded. Filenames are basename-sanitised and limited to .pdf.

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { recordDownload } from '../services/downloads.js';
import { generateDatasheetPdf } from '../services/datasheet-pdf.js';

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
