// LumenX API entry point.
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, config.host, () => {
  console.log(`[lumenx-api] listening on http://${config.host}:${config.port}`);
  console.log(`[lumenx-api] IES directory: ${config.iesDir}`);
});
