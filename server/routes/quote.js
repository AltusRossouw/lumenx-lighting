// OrbitX planner quote-request route (open — no auth).
// Stores the lead in `quote_requests` so the sales team can follow up.

import { Router } from 'express';
import { queryOne } from '../db.js';
import { normalizeEmail, isValidEmail } from '../middleware/validation.js';
import { notifyLead } from '../services/mail.js';

export const quoteRouter = () => {
  const router = Router();

  // POST /api/quote
  router.post('/', async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = normalizeEmail(body.email);

      if (!name) {
        return res.status(400).json({ error: 'A name is required.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const project = {
        projectName: body.projectName ?? null,
        roomDimensions: body.roomDimensions ?? null,
        roomArea: body.roomArea ?? null,
        activityType: body.activityType ?? null,
        luminaireCount: body.luminaireCount ?? null,
        luminaireSummary: body.luminaireSummary ?? null,
        results: body.results ?? null,
      };

      const row = await queryOne(
        `INSERT INTO quote_requests (name, email, phone, company, message, project)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          name,
          email,
          typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null,
          typeof body.company === 'string' && body.company.trim() ? body.company.trim() : null,
          typeof body.message === 'string' && body.message.trim() ? body.message.trim() : null,
          JSON.stringify(project),
        ],
      );

      // Best-effort notification — never fail the request over email.
      try {
        await notifyLead({
          kind: 'planner quote',
          subject: `Planner quote: ${body.projectName || name}`,
          lines: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${body.phone || '—'}`,
            `Company: ${body.company || '—'}`,
            `Project: ${body.projectName || '—'}`,
            `Area: ${body.roomArea ? `${body.roomArea} m²` : '—'}`,
            `Luminaires: ${body.luminaireCount ?? '—'}`,
            `Summary: ${body.luminaireSummary || '—'}`,
            '',
            body.message || '—',
          ],
        });
      } catch (err) {
        console.error('[quote] notify failed:', err.message);
      }

      return res.status(201).json({ ok: true, quoteId: row.id });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
