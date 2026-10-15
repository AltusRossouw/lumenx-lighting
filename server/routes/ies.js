// IES routes.
//
//  * GET /api/ies               — OPEN metadata listing (files + planner profiles).
//  * GET /api/ies/product-map   — OPEN product → filenames map (assignments).
//  * GET /api/ies/:filename     — gated raw-file download (signed-in account only).
//
// Raw photometry for the OrbitX planner is streamed from the separate
// `/api/planner/ies/:filename` route so the public planner never exposes the
// gated download path.
//
// The product map is metadata only: it says which photometric file belongs to
// which product, exactly as `GET /api/ies` already lists every file's name. The
// files themselves stay behind `requireAuth` (client decision Q10).

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { requireAuth } from '../middleware/auth.js';
import { listIesFiles, resolveIesPath, humanizeIesLabel } from '../services/ies.js';
import { buildProductMap } from '../services/ies-product-map.js';
import { recordDownload } from '../services/downloads.js';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Map a Luminex IES file to the OrbitX planner's profile shape.
const toPlannerProfile = (file) => ({
  id: file.filename,
  productSlug: slugify(file.name) || file.filename,
  productName: file.name,
  variantLabel: file.name,
  url: `/api/planner/ies/${encodeURIComponent(file.filename)}`,
  lumens: file.lumens,
  beamAngle: null,
});

export const iesRouter = () => {
  const router = Router();

  // GET /api/ies — open metadata (wall garden `files` + planner `profiles`).
  router.get('/', async (_req, res, next) => {
    try {
      const files = await listIesFiles();
      const profiles = files.map(toPlannerProfile);
      return res.json({ files, profiles });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/ies/product-map — which files belong to which product slug.
  // Must be declared before `/:filename` so it is not read as a filename.
  router.get('/product-map', async (_req, res, next) => {
    try {
      const { map, files, missing, ambiguous } = await buildProductMap();
      return res.json({ map, files, missing: missing.length, ambiguous });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/ies/:filename — gated raw download (signed-in account).
  router.get('/:filename', requireAuth, (req, res, next) => {
    try {
      const filePath = resolveIesPath(req.params.filename);
      if (!filePath) {
        return res.status(404).json({ error: 'IES file not found.' });
      }

      // Resolve once more defensively against traversal (allowlist only).
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'IES file not found.' });
      }

      // Track the download against the authenticated user.
      recordDownload({
        userId: req.user?.id ?? null,
        email: req.user?.email ?? null,
        filename: path.basename(filePath),
        kind: 'ies',
        ip: req.ip,
      });

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${humanizeIesLabel('', path.basename(filePath))}.ies"`,
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(filePath).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
