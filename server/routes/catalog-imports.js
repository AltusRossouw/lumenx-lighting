// AI spec-sheet import routes (admin only).
//
//   GET  /status                     capability probe for the admin button
//   POST /source                     upload a manufacturer PDF (raw body)
//   POST /                            start analysis with the category list
//   GET  /                            recent imports
//   GET  /:id                         poll one import
//   GET  /:id/source                  admin-only source PDF
//   GET  /:id/images/:index           admin-only extracted image candidate
//   POST /:id/retry                   retry a failed/canceled job
//   POST /:id/cancel                  cancel a running job
//   POST /:id/adopt                   copy candidates into public product images

import express, { Router } from 'express';
import fs from 'node:fs';
import { requireAdmin } from '../middleware/auth.js';
import {
  adoptImportImages,
  cancelImport,
  capabilities,
  createImportSource,
  getImport,
  getImportImage,
  getImportSource,
  listImports,
  retryImport,
  startImport,
} from '../services/catalog-import.js';
import { sanitizeOriginalName } from '../services/uploads.js';
import { logActivity } from '../services/activity.js';

const rawPdf = express.raw({ type: () => true, limit: '25mb' });

const uploadBodyError = (err, _req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'That PDF is larger than the 25 MB upload limit.' });
  }
  if (err?.status >= 400 && err?.status < 500) {
    return res.status(err.status).json({ error: 'The upload could not be read.' });
  }
  return next(err);
};

const sendError = (err, res, next) => {
  if (err?.status) return res.status(err.status).json({ error: err.message });
  return next(err);
};

const actor = (req) => req.user?.email ?? 'admin-key';

export const catalogImportRouter = () => {
  const router = Router();
  router.use(requireAdmin);

  // Capability probe. The admin uses this to disable the import button with a
  // useful explanation instead of failing after a 25 MB upload.
  router.get('/status', (_req, res) => {
    return res.json(capabilities());
  });

  // Raw PDF upload. Metadata travels in the query string, matching the raw
  // upload pattern used by the IES library and product images.
  router.post('/source', rawPdf, uploadBodyError, async (req, res, next) => {
    try {
      const originalName = sanitizeOriginalName(String(req.query.filename ?? '').trim()) || 'spec-sheet.pdf';
      const job = await createImportSource({
        buffer: req.body,
        originalName,
        createdBy: actor(req),
      });
      await logActivity(req, {
        action: 'import.source',
        entityType: 'import',
        entityId: job.id,
        summary: `Uploaded manufacturer spec sheet "${originalName}"`,
        metadata: { filename: originalName },
      });
      return res.status(201).json({ ok: true, import: job });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const sourceId = String(req.body?.sourceId ?? '').trim();
      if (!sourceId) return res.status(400).json({ error: 'A source upload is required.' });
      const job = await startImport({
        id: sourceId,
        categories: req.body?.categories,
        pageHint: req.body?.pageHint,
        modelHint: req.body?.modelHint,
      });
      await logActivity(req, {
        action: 'import.create',
        entityType: 'import',
        entityId: job.id,
        summary: 'Started an AI spec-sheet import',
        metadata: { sourceId },
      });
      return res.status(202).json({ ok: true, import: job });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.get('/', async (_req, res, next) => {
    try {
      const imports = await listImports(20);
      return res.json({ imports });
    } catch (err) {
      return next(err);
    }
  });

  // Specific sub-routes before /:id so they cannot be swallowed.
  router.get('/:id/source', async (req, res, next) => {
    try {
      const source = await getImportSource(String(req.params.id ?? '').trim());
      if (!source) return res.status(404).json({ error: 'Source PDF not found.' });
      const safeName = source.filename.replace(/"/g, '');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + safeName + '"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return fs.createReadStream(source.absolutePath).on('error', next).pipe(res);
    } catch (err) {
      return next(err);
    }
  });

  router.get('/:id/images/:index', async (req, res, next) => {
    try {
      const image = await getImportImage(
        String(req.params.id ?? '').trim(),
        Number.parseInt(String(req.params.index ?? ''), 10),
      );
      if (!image) return res.status(404).json({ error: 'Image not found.' });
      res.setHeader('Content-Type', image.mime);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.send(image.buffer);
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/retry', async (req, res, next) => {
    try {
      const job = await retryImport(String(req.params.id ?? '').trim());
      await logActivity(req, {
        action: 'import.retry',
        entityType: 'import',
        entityId: job.id,
        summary: 'Retried an AI spec-sheet import',
      });
      return res.status(202).json({ ok: true, import: job });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.post('/:id/cancel', async (req, res, next) => {
    try {
      const job = await cancelImport(String(req.params.id ?? '').trim());
      await logActivity(req, {
        action: 'import.cancel',
        entityType: 'import',
        entityId: job.id,
        summary: 'Cancelled an AI spec-sheet import',
      });
      return res.json({ ok: true, import: job });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.post('/:id/adopt', async (req, res, next) => {
    try {
      const importId = String(req.params.id ?? '').trim();
      const slug = String(req.body?.slug ?? '').trim();
      const images = await adoptImportImages(importId, { slug });
      await logActivity(req, {
        action: 'import.adopt',
        entityType: 'import',
        entityId: importId,
        summary: 'Adopted images from an AI spec-sheet import',
        metadata: { importId, slug, images: Array.isArray(images) ? images.length : 0 },
      });
      return res.json({ ok: true, images });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const job = await getImport(String(req.params.id ?? '').trim());
      if (!job) return res.status(404).json({ error: 'Import not found.' });
      return res.json({ import: job });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
