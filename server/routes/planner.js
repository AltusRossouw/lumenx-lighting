// OrbitX planner photometry routes.
// The lighting planner parses raw IES files to run photometric calculations.
// These routes stream the same Luminex IES files the walled garden serves, and
// are gated behind login exactly like the walled garden (no traversal).

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { resolveLuminexIesPath } from '../services/ies.js';
import { requireAuth } from '../middleware/auth.js';

export const plannerRouter = () => {
  const router = Router();

  // GET /api/planner/ies/:filename — stream a raw IES file for photometry.
  router.get('/ies/:filename', requireAuth, (req, res, next) => {
    try {
      const filePath = resolveLuminexIesPath(req.params.filename);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'IES file not found.' });
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(filePath).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
