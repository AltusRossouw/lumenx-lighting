// IES walled-garden routes — the ONLY place raw IES files can be downloaded.
// Both handlers sit behind `requireAuth`: any signed-in account may download
// (sign-up is self-serve with no approval gate).

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { requireAuth } from '../middleware/auth.js';
import { listLuminexIesFiles, resolveLuminexIesPath } from '../services/ies.js';
import { recordDownload } from '../services/downloads.js';

export const iesRouter = () => {
  const router = Router();

  // Every IES route requires a signed-in account.
  router.use(requireAuth);

  // GET /api/ies — approved-only metadata listing (no raw file content).
  router.get('/', async (_req, res, next) => {
    try {
      const files = await listLuminexIesFiles();
      return res.json({ files });
    } catch (err) {
      return next(err);
    }
  });

  // GET /api/ies/:filename — stream a single approved IES file.
  router.get('/:filename', (req, res, next) => {
    try {
      const filePath = resolveLuminexIesPath(req.params.filename);
      if (!filePath) {
        return res.status(404).json({ error: 'IES file not found.' });
      }

      // Resolve once more defensively against traversal (allowlist only).
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'IES file not found.' });
      }

      // Track the download against the authenticated, approved user.
      recordDownload({
        userId: req.user?.id ?? null,
        email: req.user?.email ?? null,
        filename: path.basename(filePath),
        kind: 'ies',
        ip: req.ip,
      });

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(filePath).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
