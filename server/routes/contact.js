// Public contact-form route (open — no auth).
// Stores the enquiry in `contact_requests` and notifies the sales inbox.

import { Router } from 'express';
import { queryOne } from '../db.js';
import { normalizeEmail, isValidEmail } from '../middleware/validation.js';
import { notifyLead } from '../services/mail.js';

const str = (value, max = 2000) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const contactRouter = () => {
  const router = Router();

  // POST /api/contact
  router.post('/', async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const name = str(body.name, 200);
      const email = normalizeEmail(body.email);
      const message = str(body.message, 8000);

      if (!name) {
        return res.status(400).json({ error: 'Your name is required.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const row = await queryOne(
        `INSERT INTO contact_requests
           (name, email, phone, company, project_name, project_type, project_stage, support_required, message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          name,
          email,
          str(body.phone, 50) || null,
          str(body.company, 200) || null,
          str(body.projectName, 200) || null,
          str(body.projectType, 100) || null,
          str(body.projectStage, 100) || null,
          str(body.supportRequired, 200) || null,
          message || null,
        ],
      );

      // Best-effort notification — never fail the request over email.
      try {
        await notifyLead({
          kind: 'contact enquiry',
          subject: `New enquiry: ${str(body.projectName, 80) || name}`,
          lines: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${str(body.phone, 50) || '—'}`,
            `Company: ${str(body.company, 200) || '—'}`,
            `Project: ${str(body.projectName, 200) || '—'}`,
            `Type: ${str(body.projectType, 100) || '—'}`,
            `Stage: ${str(body.projectStage, 100) || '—'}`,
            `Support required: ${str(body.supportRequired, 200) || '—'}`,
            '',
            message || '—',
          ],
        });
      } catch (err) {
        console.error('[contact] notify failed:', err.message);
      }

      return res.status(201).json({ ok: true, id: row.id });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
