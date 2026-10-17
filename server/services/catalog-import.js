// AI spec-sheet import jobs.
//
// A job is created when the admin uploads a manufacturer PDF, then started with
// the current LumenX category list. Work runs in-process (single container) and
// every stage is persisted in catalog_imports, so the admin can poll and can
// navigate away. The AI never writes a product row; it returns a draft that the
// product editor reviews and saves.

import { config } from '../config.js';
import { query, queryOne } from '../db.js';
import { extractPdfForImport, pdfToolsStatus } from './pdf-extract.js';
import { analyzeSpecSheet, deepseekStatus, isDeepSeekConfigured } from './deepseek.js';
import {
  absoluteUploadPath,
  copyToProductImage,
  readUpload,
  saveImportImage,
  saveSourcePdf,
  slugify,
} from './uploads.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORY_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const PAGE_HINT_RE = /^\d{1,4}(\s*-\s*\d{1,4})?$/;
const MAX_CATEGORIES = 100;

const httpError = (message, status = 400) => Object.assign(new Error(message), { status });

const clean = (value, max) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

export const capabilities = () => {
  const pdf = pdfToolsStatus();
  const deepseek = deepseekStatus();
  return {
    ...deepseek,
    pdfTools: pdf,
    enabled: deepseek.configured && config.aiImportEnabled && pdf.available,
  };
};

const assertReady = () => {
  const caps = capabilities();
  if (!config.aiImportEnabled) {
    throw httpError('AI import is disabled in the server configuration.', 503);
  }
  if (!caps.configured) {
    throw httpError('AI import is not configured. Add DEEPSEEK_API_KEY to the server environment.', 503);
  }
  if (!caps.pdfTools.available) {
    throw httpError('PDF extraction tools are not installed on the server (poppler-utils).', 503);
  }
  return caps;
};

export const sanitizeCategories = (value) => {
  const categories = [];
  const seen = new Set();
  for (const entry of Array.isArray(value) ? value : []) {
    if (!entry || typeof entry !== 'object') continue;
    const id = clean(entry.id, 80);
    const title = clean(entry.title, 120);
    if (!CATEGORY_SLUG_RE.test(id) || !title || seen.has(id)) continue;
    seen.add(id);
    categories.push({ id, title });
    if (categories.length >= MAX_CATEGORIES) break;
  }
  return categories;
};

const sanitizePageHint = (value) => {
  const hint = clean(value, 20);
  if (!hint) return null;
  if (!PAGE_HINT_RE.test(hint)) throw httpError('Page range must look like "1" or "1-4".');
  return hint;
};

const sanitizeModelHint = (value) => clean(value, 200) || null;

const importView = (row, { withResult = true } = {}) => {
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.id,
    status: row.status,
    statusMessage: row.status_message,
    originalName: row.original_name,
    bytes: row.bytes,
    pageCount: row.page_count,
    model: row.model,
    sourceUrl: '/api/admin/catalog/imports/' + row.id + '/source',
    images: images.map((image, index) => ({
      url: '/api/admin/catalog/imports/' + row.id + '/images/' + index,
      width: image.width ?? null,
      height: image.height ?? null,
      mime: image.mime ?? 'image/png',
    })),
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
    result: withResult ? row.result ?? null : null,
    error: row.error,
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getRow = async (id) => {
  if (!isUuid(id)) return null;
  return queryOne('SELECT * FROM catalog_imports WHERE id = $1', [id]);
};

const UPDATE_COLUMNS = new Set([
  'status',
  'status_message',
  'page_count',
  'images',
  'warnings',
  'result',
  'raw_response',
  'tokens_in',
  'tokens_out',
  'model',
  'error',
  'category_ids',
  'page_hint',
  'model_hint',
]);

const updateRow = async (id, fields) => {
  const keys = Object.keys(fields).filter(
    (key) => UPDATE_COLUMNS.has(key) && fields[key] !== undefined,
  );
  if (keys.length === 0) return;
  const sets = keys.map((key, index) => key + ' = $' + (index + 2));
  const values = keys.map((key) => fields[key]);
  await query(
    'UPDATE catalog_imports SET ' + sets.join(', ') + ', updated_at = now() WHERE id = $1',
    [id, ...values],
  );
};

const isCanceled = async (id) => {
  const row = await getRow(id);
  return !row || row.status === 'canceled';
};

/* ── Queue ─────────────────────────────────────────────────────────────── */

const queue = [];
let activeJob = null;

const enqueue = (id) => {
  if (!queue.includes(id) && activeJob !== id) queue.push(id);
  setImmediate(drain);
};

const drain = () => {
  if (activeJob || queue.length === 0) return;
  const id = queue.shift();
  activeJob = id;
  runImport(id)
    .catch((err) => {
      console.error('[catalog-import] worker failed:', err?.message || err);
    })
    .finally(() => {
      activeJob = null;
      setImmediate(drain);
    });
};

/* ── Worker ────────────────────────────────────────────────────────────── */

const runImport = async (id) => {
  const row = await getRow(id);
  if (!row || row.status === 'canceled') return;

  try {
    const sourcePath = absoluteUploadPath(row.source_path);
    if (!sourcePath) throw new Error('The source PDF could not be found.');

    await updateRow(id, {
      status: 'extracting',
      status_message: 'Reading the PDF…',
      error: null,
    });

    const extracted = await extractPdfForImport(sourcePath, { pages: row.page_hint });
    if (extracted.chars < 20 && extracted.pageImages.length === 0) {
      throw new Error(
        'No readable text or page images were found. The PDF may be blank or copy-protected.',
      );
    }

    // Persist large embedded images as private candidates. The admin chooses
    // which (if any) become public product images when accepting the draft.
    const images = [];
    for (let i = 0; i < extracted.images.length; i += 1) {
      const image = extracted.images[i];
      const saved = await saveImportImage({ buffer: image.buffer, jobId: id, index: i });
      if (saved) {
        images.push({
          ...saved,
          width: image.width,
          height: image.height,
        });
      }
    }

    await updateRow(id, {
      page_count: extracted.info.pages,
      images: JSON.stringify(images),
      warnings: JSON.stringify(extracted.warnings),
    });

    if (await isCanceled(id)) return;

    await updateRow(id, {
      status: 'analyzing',
      status_message: 'Analysing with ' + config.deepseekModel + '…',
    });

    const categories = Array.isArray(row.category_ids) ? row.category_ids : [];
    const analysis = await analyzeSpecSheet({
      text: extracted.text,
      pageImages: extracted.pageImages,
      categories,
      modelHint: row.model_hint || '',
      pageCount: extracted.info.pages,
    });

    if (await isCanceled(id)) return;

    const warnings = [
      ...new Set([
        ...extracted.warnings,
        ...(Array.isArray(analysis.draft.warnings) ? analysis.draft.warnings : []),
      ]),
    ];

    await updateRow(id, {
      status: 'ready',
      status_message: 'Draft ready for review.',
      result: JSON.stringify(analysis.draft),
      raw_response: analysis.raw,
      tokens_in: analysis.usage.input,
      tokens_out: analysis.usage.output,
      model: analysis.model,
      warnings: JSON.stringify(warnings),
      error: null,
    });
  } catch (err) {
    if (await isCanceled(id)) return;
    const message = err?.message || 'The import failed.';
    await updateRow(id, {
      status: 'failed',
      status_message: 'Import failed.',
      error: message,
    }).catch((updateErr) => {
      console.error('[catalog-import] could not record failure:', updateErr?.message || updateErr);
    });
  }
};

/* ── Public service API ────────────────────────────────────────────────── */

export const createImportSource = async ({ buffer, originalName, createdBy = null }) => {
  assertReady();
  const saved = await saveSourcePdf({
    buffer,
    originalName,
    slug: originalName || 'source',
  });
  const row = await queryOne(
    `INSERT INTO catalog_imports
       (source_path, original_name, bytes, status, status_message, model, created_by)
     VALUES ($1, $2, $3, 'queued', 'Uploaded. Start the analysis to continue.', $4, $5)
     RETURNING *`,
    [saved.relativePath, saved.originalName, saved.bytes, config.deepseekModel, createdBy],
  );
  return importView(row);
};

export const startImport = async ({ id, categories, pageHint, modelHint }) => {
  assertReady();
  const row = await getRow(id);
  if (!row) throw httpError('Import not found.', 404);
  if (['queued', 'extracting', 'analyzing'].includes(row.status) && activeJob === id) {
    throw httpError('This import is already running.', 409);
  }
  if (row.status === 'ready') {
    throw httpError('This import is already ready. Start a new import to re-analyse it.', 409);
  }

  const cleanCategories = sanitizeCategories(categories);
  const cleanPageHint = sanitizePageHint(pageHint);
  const cleanModelHint = sanitizeModelHint(modelHint);

  await updateRow(id, {
    status: 'queued',
    status_message: 'Queued for analysis…',
    category_ids: JSON.stringify(cleanCategories),
    page_hint: cleanPageHint,
    model_hint: cleanModelHint,
    result: null,
    raw_response: null,
    tokens_in: null,
    tokens_out: null,
    error: null,
  });
  enqueue(id);
  const updated = await getRow(id);
  return importView(updated);
};

export const getImport = async (id) => {
  const row = await getRow(id);
  return row ? importView(row) : null;
};

export const listImports = async (limit = 20) => {
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const result = await query(
    'SELECT * FROM catalog_imports ORDER BY created_at DESC LIMIT $1',
    [size],
  );
  return result.rows.map((row) => importView(row));
};

export const retryImport = async (id) => {
  assertReady();
  const row = await getRow(id);
  if (!row) throw httpError('Import not found.', 404);
  if (!['failed', 'canceled'].includes(row.status)) {
    throw httpError('Only a failed or canceled import can be retried.', 409);
  }
  await updateRow(id, {
    status: 'queued',
    status_message: 'Queued for retry…',
    result: null,
    raw_response: null,
    tokens_in: null,
    tokens_out: null,
    error: null,
    images: JSON.stringify([]),
    warnings: JSON.stringify([]),
  });
  enqueue(id);
  const updated = await getRow(id);
  return importView(updated);
};

export const cancelImport = async (id) => {
  const row = await getRow(id);
  if (!row) throw httpError('Import not found.', 404);
  if (!['queued', 'extracting', 'analyzing'].includes(row.status)) {
    throw httpError('This import is not running.', 409);
  }
  const index = queue.indexOf(id);
  if (index >= 0) queue.splice(index, 1);
  await updateRow(id, {
    status: 'canceled',
    status_message: 'Canceled by an administrator.',
  });
  const updated = await getRow(id);
  return importView(updated);
};

export const getImportSource = async (id) => {
  const row = await getRow(id);
  if (!row) return null;
  const absolutePath = absoluteUploadPath(row.source_path);
  if (!absolutePath) return null;
  return { absolutePath, filename: row.original_name || 'source.pdf' };
};

export const getImportImage = async (id, index) => {
  const row = await getRow(id);
  if (!row) return null;
  const image = Array.isArray(row.images) ? row.images[Number(index)] : null;
  if (!image?.relativePath) return null;
  const file = await readUpload(image.relativePath);
  if (!file) return null;
  return { buffer: file.buffer, mime: image.mime || 'image/png', filename: image.filename || 'candidate.png' };
};

/** Copy the private candidate images into the public product-image folder. */
export const adoptImportImages = async (id, { slug }) => {
  const row = await getRow(id);
  if (!row) throw httpError('Import not found.', 404);
  const images = Array.isArray(row.images) ? row.images : [];
  if (images.length === 0) return [];
  const cleanSlug = slugify(slug) || 'imported-product';
  const alt = row.result?.product?.suggestedName || 'Imported product image';
  const adopted = [];
  for (const image of images) {
    if (!image?.relativePath) continue;
    try {
      const productImage = await copyToProductImage({
        relativePath: image.relativePath,
        slug: cleanSlug,
        alt,
        width: image.width,
        height: image.height,
      });
      adopted.push({
        src: productImage.url,
        alt,
        fit: 'contain',
        width: productImage.width ?? image.width ?? undefined,
        height: productImage.height ?? image.height ?? undefined,
      });
    } catch {
      // Skip an unreadable candidate rather than failing the whole draft.
    }
  }
  return adopted;
};

/** Called at boot: in-process jobs cannot survive a restart. */
export const sweepStaleImports = async () => {
  try {
    await query(
      `UPDATE catalog_imports
       SET status = 'failed',
           status_message = 'Server restarted before the import completed.',
           error = 'The server restarted while this import was running. Retry it.',
           updated_at = now()
       WHERE status IN ('queued', 'extracting', 'analyzing')`,
    );
  } catch (err) {
    console.error('[catalog-import] startup sweep failed:', err?.message || err);
  }
};
