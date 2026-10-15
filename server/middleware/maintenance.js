// Maintenance-mode middleware. When enabled (config.maintenanceMode), the entire
// site — the SPA, static assets, and every /api route — is taken offline and
// replaced with a static maintenance page (HTTP 503).
//
// /api/health is intentionally left live so the container healthcheck keeps
// passing and the reverse proxy never marks the app unhealthy during a window.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagePath = path.join(__dirname, '..', 'maintenance.html');

let maintenanceHtml = '';
try {
  maintenanceHtml = fs.readFileSync(pagePath, 'utf8');
} catch (err) {
  console.error('[maintenance] failed to load maintenance.html:', err.message);
}

export const maintenance = () => (req, res, next) => {
  if (!config.maintenanceMode) return next();
  if (req.path === '/api/health') return next();

  res.setHeader('Retry-After', '3600');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(503).type('html').send(maintenanceHtml || '<h1>Under maintenance.</h1>');
};
