// Writable media helpers for the admin catalogue.
//
// Public product/category images live under uploads/products and
// uploads/categories and are served by Express. Spec sheets, manufacturer
// source PDFs and uploaded IES files are deliberately NOT served as static
// files: they have their own tracked or authenticated routes.
//
// Files are content-addressed (a short SHA-256 suffix), so re-uploading the
// same bytes is idempotent and filenames are never derived from user input.

import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { config } from '../config.js';

export const IMAGE_MAX_BYTES = 12 * 1024 * 1024;
export const PDF_MAX_BYTES = 25 * 1024 * 1024;

export const slugify = (value) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const stemFor = (value, fallback = 'upload') => slugify(value) || fallback;

const hashOf = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 12);

/** Detect an allowed raster image by its magic bytes. Never trust the name. */
export const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
};

/** A PDF starts with %PDF- (allow a small amount of leading whitespace). */
export const looksLikePdf = (buffer) =>
  Buffer.isBuffer(buffer) && /^\s*%PDF-/.test(buffer.subarray(0, 16).toString('latin1'));

export const sanitizeOriginalName = (value) => {
  const base = path.basename(String(value ?? '')).replace(/[\u0000-\u001f]/g, '').trim();
  return base.slice(0, 200) || null;
};

export const parseDimension = (value) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 && n <= 20000 ? n : null;
};

/** Safe internal media URL: absolute path, no scheme, no traversal. */
export const isSafeMediaUrl = (value) => {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  if (!url.startsWith('/') || url.startsWith('//')) return false;
  if (url.includes('..') || url.includes('\\') || /[\u0000-\u001f]/.test(url)) return false;
  return true;
};

export const absoluteUploadPath = (relativePath) => {
  if (typeof relativePath !== 'string' || !relativePath.trim()) return null;
  const root = path.resolve(config.uploadsDir);
  const abs = path.resolve(root, relativePath);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
};

export const ensureUploadDir = async (relativeDir) => {
  const dir = absoluteUploadPath(relativeDir);
  if (!dir) throw Object.assign(new Error('Invalid upload directory.'), { status: 400 });
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const writeOnce = async (filePath, buffer) => {
  if (await exists(filePath)) return false;
  await fs.writeFile(filePath, buffer);
  return true;
};

/**
 * Save a product or category image. Returns the public URL and metadata used by
 * the product's images JSONB.
 */
export const saveImage = async ({ buffer, scope = 'product', slug, width = null, height = null }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw Object.assign(new Error('No image data received.'), { status: 400 });
  }
  if (buffer.length > IMAGE_MAX_BYTES) {
    throw Object.assign(new Error('Image is larger than the 12 MB upload limit.'), { status: 413 });
  }
  const type = detectImageType(buffer);
  if (!type) {
    throw Object.assign(new Error('Only PNG, JPEG or WebP images are supported.'), { status: 400 });
  }
  const subdir = scope === 'category' ? 'categories' : 'products';
  const dir = await ensureUploadDir(subdir);
  const filename = `${stemFor(slug)}-${hashOf(buffer)}.${type.ext}`;
  await writeOnce(path.join(dir, filename), buffer);
  return {
    url: `/uploads/${subdir}/${filename}`,
    filename,
    mime: type.mime,
    bytes: buffer.length,
    width: parseDimension(width),
    height: parseDimension(height),
  };
};

/** Save a published spec-sheet PDF. The returned URL goes through tracking. */
export const saveSpecSheet = async ({ buffer, slug, originalName = null }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw Object.assign(new Error('No PDF data received.'), { status: 400 });
  }
  if (buffer.length > PDF_MAX_BYTES) {
    throw Object.assign(new Error('PDF is larger than the 25 MB upload limit.'), { status: 413 });
  }
  if (!looksLikePdf(buffer)) {
    throw Object.assign(new Error('That file does not look like a PDF.'), { status: 400 });
  }
  const dir = await ensureUploadDir('spec-sheets');
  const filename = `${stemFor(slug)}-spec-${hashOf(buffer)}.pdf`;
  await writeOnce(path.join(dir, filename), buffer);
  return {
    url: `/api/download/spec-sheet/${filename}`,
    filename,
    bytes: buffer.length,
    originalName: sanitizeOriginalName(originalName),
  };
};

/** Store a manufacturer source PDF privately (admin-only download). */
export const saveSourcePdf = async ({ buffer, originalName = null, slug = 'source' }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw Object.assign(new Error('No PDF data received.'), { status: 400 });
  }
  if (buffer.length > PDF_MAX_BYTES) {
    throw Object.assign(new Error('PDF is larger than the 25 MB upload limit.'), { status: 413 });
  }
  if (!looksLikePdf(buffer)) {
    throw Object.assign(new Error('That file does not look like a PDF.'), { status: 400 });
  }
  const dir = await ensureUploadDir('manufacturer-specs');
  const filename = `${stemFor(slug, 'source')}-${hashOf(buffer)}.pdf`;
  await writeOnce(path.join(dir, filename), buffer);
  return {
    relativePath: `manufacturer-specs/${filename}`,
    filename,
    bytes: buffer.length,
    originalName: sanitizeOriginalName(originalName),
  };
};

/** Save an extracted image candidate under an import job directory (private). */
export const saveImportImage = async ({ buffer, jobId, index }) => {
  const type = detectImageType(buffer);
  if (!type) return null;
  const relativeDir = `imports/${slugify(jobId) || 'job'}`;
  const dir = await ensureUploadDir(relativeDir);
  const filename = `candidate-${index}.${type.ext}`;
  await fs.writeFile(path.join(dir, filename), buffer);
  return {
    relativePath: `${relativeDir}/${filename}`,
    filename,
    mime: type.mime,
    bytes: buffer.length,
  };
};

/** Read a file that lives under the uploads root. */
export const readUpload = async (relativePath) => {
  const abs = absoluteUploadPath(relativePath);
  if (!abs) return null;
  try {
    return { absolutePath: abs, buffer: await fs.readFile(abs) };
  } catch {
    return null;
  }
};

/** Copy an extracted candidate into the public product-image folder. */
export const copyToProductImage = async ({ relativePath, slug, alt = null, width = null, height = null }) => {
  const source = await readUpload(relativePath);
  if (!source) throw Object.assign(new Error('The selected image no longer exists.'), { status: 404 });
  const image = await saveImage({ buffer: source.buffer, scope: 'product', slug, width, height });
  return { ...image, alt: alt || undefined };
};

/** Best-effort delete of a file under the uploads root. */
export const removeUpload = async (relativePath) => {
  const abs = absoluteUploadPath(relativePath);
  if (!abs) return false;
  try {
    await fs.unlink(abs);
    return true;
  } catch {
    return false;
  }
};

/** Which public subdirectories are safe to expose through express.static. */
export const PUBLIC_IMAGE_SUBDIRS = Object.freeze(['products', 'categories']);
