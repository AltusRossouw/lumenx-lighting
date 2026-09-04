// IES file service — the "walled garden" and design-tool allowlist.
//
// Security model:
//  * Raw IES files live OUTSIDE the public web root (config.iesDir) and are
//    only ever streamed through the authenticated, approved-only route.
//  * Every filename is resolved with path.basename() so path traversal is
//    impossible, then checked against the Luminex allowlist.
//  * The design tool only accepts files whose `[MANUFAC]` keyword is Luminex —
//    a scraper uploading (or requesting) a third-party IES file is rejected.

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const LUMENX_MANUFACTURERS = ['lumenx', 'luminex'];

// Filenames are only considered Luminex when prefixed with the brand marker.
// This keeps the allowlist explicit rather than trusting arbitrary uploads.
export const isLuminexFilename = (filename) =>
  typeof filename === 'string' && /^lumenx[_-]/i.test(filename) && filename.toLowerCase().endsWith('.ies');

// Strip any directory component and return the bare, validated name (or null).
export const safeIesFilename = (filename) => {
  if (typeof filename !== 'string') return null;
  const base = path.basename(filename);
  return isLuminexFilename(base) ? base : null;
};

// Parse the key fields we need from an LM-63 IES file.
export const parseIes = (text) => {
  const lines = String(text).split(/\r?\n/);
  let manufacturer = '';
  let luminaireName = '';
  let luminaire = '';
  let lumensPerLamp = null;
  let inputWatts = null;
  let inTilt = false;
  let headerRead = false;
  let remaining = null;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    const kw = raw.toUpperCase();

    if (kw.startsWith('[MANUFAC]')) {
      manufacturer = raw.slice('[MANUFAC]'.length).trim();
    } else if (kw.startsWith('[LUMCAT]')) {
      luminaireName = raw.slice('[LUMCAT]'.length).trim();
    } else if (kw.startsWith('[LUMINAIRE]')) {
      luminaire = raw.slice('[LUMINAIRE]'.length).trim();
    } else if (kw.startsWith('[TEST]') && !luminaireName) {
      luminaireName = raw.slice('[TEST]'.length).trim();
    } else if (kw.startsWith('[INPUTWATTS]')) {
      const w = Number.parseFloat(raw.slice('[INPUTWATTS]'.length).trim());
      if (Number.isFinite(w)) inputWatts = w;
    } else if (kw === 'TILT=NONE' || kw.startsWith('TILT=')) {
      inTilt = true;
    } else if (inTilt && !headerRead && /^\d/.test(raw)) {
      // First data line after TILT is the photometric header:
      // <lamps> <lumens/lamp> <multiplier> <v-angles> <h-angles> <type> <units> <w> <l> <h>
      const parts = raw.split(/\s+/).map(Number).filter((n) => Number.isFinite(n));
      if (parts.length >= 2) {
        lumensPerLamp = parts[1];
        remaining = parts;
      }
      headerRead = true;
    }
  }

  return {
    manufacturer,
    luminaireName,
    luminaire,
    lumensPerLamp,
    inputWatts,
    rawHeader: remaining,
  };
};

// Validate that a parsed IES body belongs to a Luminex product.
export const isLuminexIes = (parsed) =>
  LUMENX_MANUFACTURERS.includes(String(parsed.manufacturer).toLowerCase());

// Read one allowed IES file, returning { filename, text, parsed } or null.
export const readLuminexIesFile = async (filename) => {
  const safe = safeIesFilename(filename);
  if (!safe) return null;
  const text = await fs.readFile(path.join(config.iesDir, safe), 'utf8');
  const parsed = parseIes(text);
  if (!isLuminexIes(parsed)) return null;
  return { filename: safe, text, parsed };
};

// List every Luminex IES file as public-safe metadata (never raw file content).
export const listLuminexIesFiles = async () => {
  let entries;
  try {
    entries = await fs.readdir(config.iesDir);
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries.sort()) {
    if (!isLuminexFilename(entry)) continue;
    try {
      const text = await fs.readFile(path.join(config.iesDir, entry), 'utf8');
      const parsed = parseIes(text);
      if (!isLuminexIes(parsed)) continue;
      files.push({
        id: entry,
        filename: entry,
        name: parsed.luminaireName || entry.replace(/^lumenx[_-]/i, '').replace(/\.ies$/i, ''),
        lumens: parsed.lumensPerLamp,
        watts: parsed.inputWatts,
        manufacturer: parsed.manufacturer,
      });
    } catch {
      // Skip unreadable/corrupt files rather than failing the whole listing.
    }
  }
  return files;
};

// Full path for an allowed IES file (used by the protected download route).
export const resolveLuminexIesPath = (filename) => {
  const safe = safeIesFilename(filename);
  return safe ? path.join(config.iesDir, safe) : null;
};

// ── Broad IES catalogue (LumenX + partner brands) ─────────────────────────
// The IES walled garden serves LumenX-branded files plus the OrbitX partner
// brand. Files are brand-prefixed at import time, so the allowlist is the
// trusted brand prefix rather than the free-text [MANUFAC] keyword (which is
// inconsistent across supplier files).

const BRAND_PREFIX_RE = /^(lumenx|orbitx)[_-]/i;

const BRAND_LABELS = {
  lumenx: 'LumenX',
  orbitx: 'OrbitX',
};

export const isIesFilename = (filename) =>
  typeof filename === 'string' &&
  BRAND_PREFIX_RE.test(filename) &&
  filename.toLowerCase().endsWith('.ies');

const safeAllowedIesFilename = (filename) => {
  if (typeof filename !== 'string') return null;
  const base = path.basename(filename);
  return isIesFilename(base) ? base : null;
};

const brandOf = (filename) => {
  const match = BRAND_PREFIX_RE.exec(filename);
  return match ? match[1].toLowerCase() : null;
};

const nameFromFilename = (filename) =>
  filename
    .replace(BRAND_PREFIX_RE, '')
    .replace(/\.ies$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

// Turn a technical IES label/filename into a readable, Title-Cased product name:
//   lumenx-100w-samurai-ufo-120d.ies  →  Samurai UFO 100 W 120°
//   lumenx-1200x300-backlit.ies       →  1200×300 Backlit
export const humanizeIesLabel = (label, filename) => {
  let s = String(label || '').trim();
  if (s.length < 2 || /^lumenx[_-]/i.test(s)) {
    s = nameFromFilename(filename);
  } else {
    s = s.replace(/[-_]+/g, ' ');
  }

  s = s
    .replace(/(\d+(?:\.\d+)?)w\b/gi, '$1 W')
    .replace(/(\d+(?:\.\d+)?)d\b/gi, '$1°')
    .replace(/(\d+(?:\.\d+)?)x(?=\d)/gi, '$1×')
    .replace(/\biesna\d*/gi, '')
    .replace(/\b(?:ies|file|luminaire)\b/gi, '')
    .replace(/\bhd\b/gi, 'HD')
    .replace(/\bufo\b/gi, 'UFO')
    .replace(/\bled\b/gi, 'LED')
    .replace(/\bip(\d+)\b/gi, 'IP$1')
    .replace(/\bcob\b/gi, 'COB')
    .replace(/\bpc\b/gi, 'PC')
    .replace(/\bir\b/gi, 'IR')
    .replace(/\bhf\b/gi, 'HF')
    .replace(/\b3cct\b/gi, '3CCT')
    .replace(/\bcct\b/gi, 'CCT')
    .replace(/\buv\b/gi, 'UV')
    .replace(/\s+/g, ' ')
    .trim();

  return s.replace(/\b\w/g, (c) => c.toUpperCase());
};

// Does a label read like a real product name (letters present, not just a
// spec token such as "120°", "5700K", "IP65")?
const looksLikeName = (label) => {
  const t = String(label || '').trim();
  if (!t || t.length < 3) return false;
  const letters = (t.match(/[a-z]/gi) || []).length;
  return letters >= 3 && !/^[\d.,°%WKx×\s-]+$/.test(t);
};

// Prefer the in-file luminaire name only when it is a genuine name; otherwise
// derive a readable name from the filename.
export const humanizeIesName = (parsed, filename) => {
  const label = parsed?.luminaire || parsed?.luminaireName;
  return looksLikeName(label) ? humanizeIesLabel(label, filename) : humanizeIesLabel('', filename);
};

// List every IES file across all distributed brands (public-safe metadata).
export const listIesFiles = async () => {
  let entries;
  try {
    entries = await fs.readdir(config.iesDir);
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries.sort()) {
    if (!isIesFilename(entry)) continue;
    try {
      const text = await fs.readFile(path.join(config.iesDir, entry), 'utf8');
      const parsed = parseIes(text);
      files.push({
        id: entry,
        filename: entry,
        name: humanizeIesName(parsed, entry),
        lumens: parsed.lumensPerLamp,
        watts: parsed.inputWatts,
        manufacturer: BRAND_LABELS[brandOf(entry)] || parsed.manufacturer || 'LumenX',
      });
    } catch {
      // Skip unreadable/corrupt files rather than failing the whole listing.
    }
  }
  return files;
};

// Full path for any allowed IES file (used by the protected download route).
export const resolveIesPath = (filename) => {
  const safe = safeAllowedIesFilename(filename);
  return safe ? path.join(config.iesDir, safe) : null;
};
