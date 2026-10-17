// LumenX API entry point.
import { createApp } from './app.js';
import { config } from './config.js';
import { sweepStaleImports } from './services/catalog-import.js';

const app = createApp();

// In-process import jobs cannot survive a restart; mark any stranded rows as
// failed so the admin sees a retry action instead of a permanently spinning job.
void sweepStaleImports();

app.listen(config.port, config.host, () => {
  console.log(`[lumenx-api] listening on http://${config.host}:${config.port}`);
  console.log(`[lumenx-api] IES directories: ${config.iesDir} + ${config.iesUploadsDir}`);
  console.log(`[lumenx-api] Uploads directory: ${config.uploadsDir}`);
});
