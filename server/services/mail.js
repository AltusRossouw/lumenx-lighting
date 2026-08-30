// Transactional email via the Resend HTTP API (no SDK dependency, keeps the
// backend dependency-light). All notifications are best-effort: when
// RESEND_API_KEY is unset (local dev), sending is skipped with a log line so
// the app keeps working without email.

import { config } from '../config.js';

export const isMailConfigured = () => Boolean(config.resendApiKey);

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!config.resendApiKey) {
    console.warn('[mail] RESEND_API_KEY not configured — skipping email.');
    return { ok: false, skipped: true };
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) {
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: config.resendFrom,
        to: recipients,
        subject,
        text,
        html: html ?? undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[mail] Resend responded ${res.status}:`, body.slice(0, 500));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { ok: false };
  }
};

// Notify the sales inbox about a new lead. `lines` is an array of "Label: value"
// strings rendered into a plain-text body.
export const notifyLead = async ({ kind, subject, lines }) => {
  if (!config.leadNotifyEmail) {
    return { ok: false, skipped: true };
  }
  const text = [`New ${kind} — ${config.publicUrl}`, '', ...lines].join('\n');
  return sendEmail({
    to: config.leadNotifyEmail,
    subject: subject || `New ${kind} — LumenX`,
    text,
  });
};
