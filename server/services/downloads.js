// Download tracking — records who (when known) downloaded which file.
// Tracking is best-effort: it must never break the actual download.

import { query } from '../db.js';

export const recordDownload = async ({ userId = null, email = null, filename, kind, ip = null }) => {
  try {
    await query(
      `INSERT INTO downloads (user_id, email, filename, kind, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, filename, kind, ip],
    );
  } catch (err) {
    // Log and swallow — a failed INSERT should never fail the download.
    console.error('[downloads] failed to record:', err.message);
  }
};
