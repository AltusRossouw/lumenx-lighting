// Generated datasheet service.
// Renders the shared datasheet template (datasheet-template/index.html) with a
// per-product JSON payload (server/datasheets-data/<slug>.json) into a real A4
// PDF using headless Chromium, and caches the result.
//
// No npm dependency required: it drives the local Chrome/Chromium binary
// directly. If `puppeteer-core` is installed it is preferred (identical
// result, cleaner process lifecycle). Point CHROME_PATH at a specific binary
// when needed (e.g. inside Docker).
//
// Adding a new product = drop `server/datasheets-data/<slug>.json` and point
// the product's pdfUrl at /api/download/datasheet/generated/<slug>.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const DATA_DIR = path.join(ROOT, 'server', 'datasheets-data');
const TEMPLATE_PATH = path.join(ROOT, 'datasheet-template', 'index.html');
const CACHE_DIR =
  process.env.DATASHEET_PDF_CACHE_DIR ||
  path.join(ROOT, 'server', 'cache', 'datasheets');

// One in-flight render per slug (avoid render storms on concurrent clicks).
const pending = new Map();

const sanitizeSlug = (value) => {
  const slug = String(value || '').replace(/\.pdf$/i, '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  return slug ? slug : null;
};

/** Generate (or return the cached) PDF for a product slug. Resolves null when
 *  no datasheet data exists for that slug. */
export async function generateDatasheetPdf(rawSlug) {
  const slug = sanitizeSlug(rawSlug);
  if (!slug) return null;
  if (pending.has(slug)) return pending.get(slug);
  const job = doGenerate(slug).finally(() => pending.delete(slug));
  pending.set(slug, job);
  return job;
}

async function doGenerate(slug) {
  const dataPath = path.join(DATA_DIR, `${slug}.json`);
  if (!fs.existsSync(dataPath)) return null;

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const dataMtime = fs.statSync(dataPath).mtimeMs;
  const templateMtime = fs.statSync(TEMPLATE_PATH).mtimeMs;

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const pdfPath = path.join(CACHE_DIR, `${slug}.pdf`);
  const stale =
    !fs.existsSync(pdfPath) ||
    fs.statSync(pdfPath).mtimeMs < Math.max(dataMtime, templateMtime);

  if (stale) {
    const html = buildHtml(data);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenx-ds-'));
    const htmlPath = path.join(tmpDir, `${slug}.html`);
    try {
      fs.writeFileSync(htmlPath, html);
      await renderHtmlToPdf(htmlPath, pdfPath);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  const stem = data.fileStem || slug;
  return {
    file: pdfPath,
    filename: `LumenX_Datasheet_${stem}.pdf`,
    slug,
  };
}

/** Inject the payload into the template and rewrite asset URLs to absolute
 *  file:// paths so the headless render can resolve the logo / product art. */
function buildHtml(data) {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const marker = '<script id="datasheet-data" type="application/json">';
  const start = html.indexOf(marker);
  const end = html.indexOf('</script>', start);
  const json = JSON.stringify(data).replace(/</g, '\\u003c'); // never close the script tag
  html = html.slice(0, start + marker.length) + '\n' + json + '\n' + html.slice(end);

  const publicPrefix = pathToFileURL(path.join(ROOT, 'public') + '/').href;
  html = html.split('../public/').join(publicPrefix);
  return html;
}

async function renderHtmlToPdf(htmlPath, pdfPath) {
  const htmlUrl = pathToFileURL(htmlPath).href;
  const puppeteer = await import('puppeteer-core').catch(() => null);
  if (puppeteer && resolveChromePath()) {
    const browser = await puppeteer.default.launch({
      executablePath: resolveChromePath(),
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.goto(htmlUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
    } finally {
      await browser.close();
    }
    return;
  }

  const chrome = resolveChromePath();
  if (!chrome) {
    throw new Error(
      'No Chrome/Chromium available for datasheet generation. ' +
        'Install Chromium or set CHROME_PATH to a Chrome binary.',
    );
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lumenx-chrome-'));
  const args = [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--no-pdf-header-footer',
    '--disable-dev-shm-usage',
    '--no-first-run',
    `--user-data-dir=${profile}`,
    '--virtual-time-budget=4000',
    `--print-to-pdf=${pdfPath}`,
    htmlUrl,
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: 'ignore' });
    const started = Date.now();
    const timer = setInterval(() => {
      if (fs.existsSync(pdfPath)) return finish(resolve);
      if (Date.now() - started > 60000) return finish(() => reject(new Error('Chrome datasheet render timed out.')));
    }, 300);

    const cleanup = () => {
      clearInterval(timer);
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
    };
    const finish = (fn) => { cleanup(); child.kill('SIGKILL'); fn(); };
    child.on('error', (err) => { cleanup(); reject(err); });
    child.on('exit', () => { /* PDF creation is polled; exit alone is not the signal */ });
  });
}

function resolveChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates =
    process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
         '/Applications/Chromium.app/Contents/MacOS/Chromium']
      : ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
         '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome'];
  return candidates.find((p) => fs.existsSync(p)) || null;
}
