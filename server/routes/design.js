// Lighting design tool routes.
//
//  * Open to everyone (no account required) — `/products`, `/calculate`.
//  * Only Luminex IES files are ever processed; the raw files are never
//    returned, so scrapers cannot extract them from the tool's directory.
//  * `/export` is the email-capture gate: a valid email must be supplied
//    before a final report can be generated, and it is logged to
//    `design_exports`.

import { Router } from 'express';
import { queryOne } from '../db.js';
import { listLuminexIesFiles, readLuminexIesFile } from '../services/ies.js';
import { calculateLuminaireCount } from '../services/design.js';
import { isValidEmail, normalizeEmail, numberInRange } from '../middleware/validation.js';
import { notifyLead } from '../services/mail.js';

const sanitizeProduct = (f) => ({
  id: f.id,
  name: f.name,
  lumens: f.lumens ?? null,
  watts: f.watts ?? null,
  manufacturer: f.manufacturer,
});

export const designRouter = () => {
  const router = Router();

  // GET /api/design/products — the Luminex IES catalogue available to the tool.
  router.get('/products', async (_req, res, next) => {
    try {
      const files = await listLuminexIesFiles();
      return res.json({ products: files.map(sanitizeProduct) });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/design/calculate — run the lumen method against ONE Luminex IES file.
  router.post('/calculate', async (req, res, next) => {
    try {
      const b = req.body ?? {};

      // Room / design inputs (SI metres and lux).
      if (!numberInRange(b.roomLength, 0.5, 500)) {
        return res.status(400).json({ error: 'Room length must be between 0.5 m and 500 m.' });
      }
      if (!numberInRange(b.roomWidth, 0.5, 500)) {
        return res.status(400).json({ error: 'Room width must be between 0.5 m and 500 m.' });
      }
      if (!numberInRange(b.targetLux, 10, 2000)) {
        return res.status(400).json({ error: 'Target illuminance must be between 10 lx and 2000 lx.' });
      }
      const workingPlaneHeight = Number(b.workingPlaneHeight ?? 0.75);
      const mountingHeight = Number(b.mountingHeight ?? 3);
      if (mountingHeight <= workingPlaneHeight) {
        return res.status(400).json({ error: 'Mounting height must exceed the working-plane height.' });
      }
      const maintenanceFactor = Number(b.maintenanceFactor ?? 0.8);
      if (!numberInRange(maintenanceFactor, 0.3, 1)) {
        return res.status(400).json({ error: 'Maintenance factor must be between 0.3 and 1.' });
      }

      // The product id must resolve to a Luminex IES file (allowlist enforced).
      const ies = await readLuminexIesFile(b.productId);
      if (!ies) {
        return res.status(400).json({ error: 'Unknown or non-Luminex product selected.' });
      }
      const lumens = Number(ies.parsed.lumensPerLamp);
      if (!Number.isFinite(lumens) || lumens <= 0) {
        return res.status(400).json({ error: 'The selected IES file has no valid lumen data.' });
      }
      const watts = Number(ies.parsed.inputWatts) || 0;

      const result = calculateLuminaireCount({
        roomLength: Number(b.roomLength),
        roomWidth: Number(b.roomWidth),
        targetLux: Number(b.targetLux),
        lumensPerFixture: lumens,
        wattsPerFixture: watts,
        maintenanceFactor,
        workingPlaneHeight,
        mountingHeight,
      });

      return res.json({
        product: { id: ies.filename, name: ies.parsed.luminaireName || b.productId, lumens, watts },
        result,
      });
    } catch (err) {
      return next(err);
    }
  });

  // POST /api/design/export — email gate + design_exports logging.
  router.post('/export', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required to export your report.' });
      }

      const report = req.body?.report ?? {};
      const inserted = await queryOne(
        `INSERT INTO design_exports (email, report)
         VALUES ($1, $2::jsonb)
         RETURNING id, email, created_at`,
        [email, JSON.stringify(report)],
      );

      // Best-effort notification — never fail the request over email.
      try {
        await notifyLead({
          kind: 'design-tool export',
          subject: `Design tool export: ${email}`,
          lines: [
            `Email: ${email}`,
            `Product: ${report?.product?.name || '—'}`,
            `Room: ${report?.room ? `${report.room.length}m × ${report.room.width}m` : '—'}`,
            `Target: ${report?.targetLux ? `${report.targetLux} lx` : '—'}`,
            `Required count: ${report?.result?.requiredCount ?? '—'}`,
          ],
        });
      } catch (err) {
        console.error('[design] notify failed:', err.message);
      }

      return res.status(201).json({
        ok: true,
        exportId: inserted.id,
        message: 'Report exported. Thank you — our team will be in touch.',
      });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
