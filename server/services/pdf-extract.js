// PDF extraction for the manufacturer spec-sheet import.
//
// DeepSeek's API accepts text and images, not PDFs, so this module bridges the
// gap with Poppler:
//   * pdftotext -layout    -> accurate text for digital PDFs (tables survive)
//   * pdftoppm             -> page JPEGs for scanned PDFs (DeepSeek vision)
//   * pdfimages            -> embedded product-image candidates
//
// Poppler is a system dependency (add poppler-utils to the Docker image). All
// commands run as child processes with timeouts; nothing is executed from the
// PDF itself.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const TEXT_TIMEOUT_MS = 30000;
const RENDER_TIMEOUT_MS = 60000;
const MAX_TEXT_BYTES = 20 * 1024 * 1024;

export const PDF_TOOLS = ['pdfinfo', 'pdftotext', 'pdftoppm', 'pdfimages'];

const hasCommand = (command) => {
  const result = spawnSync(command, ['-v'], { stdio: 'ignore' });
  return !result.error;
};

/** Availability probe for the admin status endpoint and friendly errors. */
export const pdfToolsStatus = () => {
  const tools = Object.fromEntries(PDF_TOOLS.map((command) => [command, hasCommand(command)]));
  return { available: Object.values(tools).every(Boolean), tools };
};

export const parsePageRange = (value) => {
  const match = String(value || '').trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) return null;
  const first = Math.max(1, Number.parseInt(match[1], 10));
  const last = match[2] ? Math.max(first, Number.parseInt(match[2], 10)) : first;
  return { first, last };
};

const pageArgs = (range) =>
  range ? ['-f', String(range.first), '-l', String(range.last)] : [];

export const getPdfInfo = async (filePath) => {
  let stdout;
  try {
    const result = await execFileAsync('pdfinfo', [filePath], { timeout: 20000, maxBuffer: 1024 * 1024 });
    stdout = result.stdout;
  } catch (err) {
    if (err?.code === 'ENOENT') {
      throw Object.assign(new Error('PDF tools are not installed on this server.'), { status: 503 });
    }
    throw Object.assign(new Error('That PDF could not be read. It may be corrupt.'), { status: 422 });
  }

  const line = (name) => {
    const match = stdout.match(new RegExp('^' + name + '\\s*:\\s*(.*)$', 'm'));
    return match ? match[1].trim() : '';
  };
  const pages = Number.parseInt(line('Pages'), 10) || 0;
  const encrypted = /^yes$/i.test(line('Encrypted'));
  if (encrypted) {
    throw Object.assign(
      new Error('Password-protected PDFs are not supported. Remove the password and retry.'),
      { status: 422 },
    );
  }
  if (pages <= 0) {
    throw Object.assign(new Error('That PDF has no readable pages.'), { status: 422 });
  }
  return { pages, title: line('Title'), pageSize: line('Page size') };
};

export const extractPdfText = async (filePath, range = null) => {
  try {
    const result = await execFileAsync(
      'pdftotext',
      ['-layout', '-enc', 'UTF-8', ...pageArgs(range), filePath, '-'],
      { timeout: TEXT_TIMEOUT_MS, maxBuffer: MAX_TEXT_BYTES },
    );
    const text = String(result.stdout || '').replace(/\r\n?/g, '\n');
    const pageTexts = text.split('\f');
    return {
      text,
      pageTexts,
      chars: text.replace(/\s+/g, '').length,
      emptyPages: pageTexts.filter((page) => page.replace(/\s+/g, '').length < 20).length,
    };
  } catch (err) {
    if (err?.code === 'ENOENT') {
      throw Object.assign(new Error('PDF tools are not installed on this server.'), { status: 503 });
    }
    throw Object.assign(new Error('The PDF text could not be extracted.'), { status: 422 });
  }
};

const listDir = async (dir) => {
  try {
    return (await fs.readdir(dir)).sort();
  } catch {
    return [];
  }
};

/**
 * Render pages to JPEG for the vision fallback. Returns at most maxPages
 * images. The caller owns the raw buffers; the temp directory is cleaned up.
 */
export const renderPdfPages = async (filePath, { range = null, dpi = 150, maxPages = 8, totalPages = null } = {}) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lumenx-pdf-pages-'));
  const prefix = path.join(dir, 'page');
  try {
    const args = ['-jpeg', '-r', String(dpi)];
    if (range) {
      args.push('-f', String(range.first), '-l', String(range.last));
    } else {
      args.push('-f', '1', '-l', String(Math.min(maxPages, totalPages || maxPages)));
    }
    args.push(filePath, prefix);
    try {
      await execFileAsync('pdftoppm', args, { timeout: RENDER_TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024 });
    } catch (err) {
      if (err?.code === 'ENOENT') {
        throw Object.assign(new Error('PDF rendering tools are not installed on this server.'), { status: 503 });
      }
      throw Object.assign(new Error('The PDF pages could not be rendered.'), { status: 422 });
    }

    const files = (await listDir(dir)).filter((name) => name.toLowerCase().endsWith('.jpg')).slice(0, maxPages);
    const pages = [];
    for (const name of files) {
      const buffer = await fs.readFile(path.join(dir, name));
      pages.push({ buffer, mime: 'image/jpeg', filename: name });
    }
    return pages;
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
};

const pngSize = (buffer) => {
  if (buffer.length < 24) return null;
  if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

/**
 * Best-effort extraction of large embedded images. Manufacturer sheets often
 * contain a clean product render that the admin can pick as the main image;
 * logos, icons and masks are filtered out by size and aspect ratio.
 */
export const extractEmbeddedImages = async (
  filePath,
  { maxImages = 10, minWidth = 400, minHeight = 400, maxBytes = 8 * 1024 * 1024 } = {},
) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lumenx-pdf-images-'));
  const prefix = path.join(dir, 'image');
  try {
    // pdfimages writes soft masks (smask) as separate PNGs. They are alpha
    // channels, not product photos, so use the listing to keep only real image
    // entries and to apply the size/ratio filter before reading the files.
    let allowed = null;
    try {
      const listing = await execFileAsync('pdfimages', ['-list', filePath], {
        timeout: RENDER_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
      });
      allowed = new Set();
      for (const line of String(listing.stdout || '').split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) continue;
        const page = Number.parseInt(parts[0], 10);
        const num = Number.parseInt(parts[1], 10);
        const type = parts[2];
        const width = Number.parseInt(parts[3], 10);
        const height = Number.parseInt(parts[4], 10);
        if (type !== 'image') continue;
        if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
        if (width < minWidth || height < minHeight) continue;
        const ratio = width / height;
        if (ratio > 4 || ratio < 0.25) continue;
        allowed.add(page + '-' + num);
      }
    } catch {
      allowed = null;
    }

    try {
      await execFileAsync('pdfimages', ['-png', '-p', filePath, prefix], {
        timeout: RENDER_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
      });
    } catch {
      return [];
    }

    const files = (await listDir(dir)).filter((name) => name.toLowerCase().endsWith('.png'));
    const seen = new Set();
    const candidates = [];
    for (const name of files) {
      if (allowed) {
        const match = name.match(/-(\d+)-(\d+)\.png$/i);
        if (match && !allowed.has(Number.parseInt(match[1], 10) + '-' + Number.parseInt(match[2], 10))) {
          continue;
        }
      }
      const buffer = await fs.readFile(path.join(dir, name));
      if (buffer.length > maxBytes) continue;
      const size = pngSize(buffer);
      if (!size) continue;
      if (size.width < minWidth || size.height < minHeight) continue;
      const ratio = size.width / size.height;
      if (ratio > 4 || ratio < 0.25) continue;
      const hash = createHash('sha256').update(buffer).digest('hex');
      if (seen.has(hash)) continue;
      seen.add(hash);
      candidates.push({
        buffer,
        mime: 'image/png',
        width: size.width,
        height: size.height,
        filename: name,
        bytes: buffer.length,
      });
    }

    return candidates
      .sort((a, b) => b.width * b.height - a.width * a.height)
      .slice(0, maxImages);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
};

/**
 * One entry point for the import job. Digital PDFs use the extracted text;
 * scanned PDFs fall back to page images for DeepSeek vision.
 */
export const extractPdfForImport = async (filePath, { pages = null, maxScannedPages = 8 } = {}) => {
  const range = parsePageRange(pages);
  const info = await getPdfInfo(filePath);
  const textResult = await extractPdfText(filePath, range);
  const scanned = textResult.chars < 400;
  const pageImages = scanned ? await renderPdfPages(filePath, { range, totalPages: info.pages, maxPages: maxScannedPages }) : [];
  // A scanned PDF's embedded images are the page scans themselves, not
  // product cut-outs. Do not offer them as product-image candidates.
  const images = scanned ? [] : await extractEmbeddedImages(filePath);
  return {
    info,
    range,
    text: textResult.text,
    pageTexts: textResult.pageTexts,
    chars: textResult.chars,
    scanned,
    pageImages,
    images,
    warnings: [
      ...(scanned ? ['Little selectable text was found; page images were used for vision analysis.'] : []),
      ...(scanned ? ['Product-image extraction is skipped for scanned PDFs; upload product photos separately.'] : []),
      ...(info.pages > maxScannedPages && scanned
        ? ['Only the first ' + maxScannedPages + ' pages were analysed. Use the page range field for a specific product.']
        : []),
    ],
  };
};
