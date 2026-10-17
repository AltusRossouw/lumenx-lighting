// Map a catalogue product (and its optional datasheet draft) into the JSON
// shape the LumenX A4 datasheet template expects.
//
// The AI import supplies a curated 'datasheet' object. Hand-entered products
// derive sensible stats/columns from their spec rows instead. Standard legal
// notes and contact details always come from the existing base payload.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryOne } from '../db.js';
import {
  normalizeDatasheet,
  normalizeSpecs,
  normalizeStrings,
} from './catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.join(__dirname, '..', 'datasheets-data', 'base.json');

let basePayload = null;
const base = () => {
  if (!basePayload) {
    basePayload = JSON.parse(fs.readFileSync(BASE_PATH, 'utf8'));
  }
  return basePayload;
};

/** Static category titles used when a product has not overridden the category. */
export const BASE_CATEGORY_TITLES = {
  panels: 'Panels',
  vapourproof: 'Vapour Proof',
  downlights: 'Downlights',
  strips: 'LED Strips',
  linears: 'Linear Lighting',
  track: 'Track Lighting',
  highbays: 'Highbays',
  bulkheads: 'Bulkheads',
  floods: 'Floodlights',
  'architectural-indoor': 'Architectural — Indoor & Decorative',
  'outdoor-architectural': 'Architectural — Outdoor',
  bollards: 'Bollards',
  street: 'Street & Area Lighting',
  solar: 'Solar',
  profiles: 'Profiles & Accessories',
  sensors: 'Sensors',
};

/** Prefer a DB category title, then a supplied fallback, then the static map. */
export const categoryTitleFor = async (id, fallback = null) => {
  try {
    const row = await queryOne('SELECT title FROM catalog_categories WHERE id = $1', [id]);
    if (row?.title) return row.title;
  } catch {
    // A DB hiccup should not stop a datasheet render.
  }
  return fallback || BASE_CATEGORY_TITLES[id] || id || 'Products';
};

const toTemplateSrc = (src) => {
  if (!src) return '';
  if (src.startsWith('/uploads/')) return '../uploads/' + src.slice('/uploads/'.length);
  if (src.startsWith('/')) return '../public' + src;
  return src;
};

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

const hasLabel = (rows, pattern) => rows.some((row) => pattern.test(row.label));

/** Fallback stats for a hand-entered product. */
const deriveStats = (specs) => {
  const patterns = [
    { label: 'Power', pattern: /^(wattage|power)$/i },
    { label: 'Lumens', pattern: /lumens|luminous flux/i },
    { label: 'Efficacy', pattern: /efficacy/i },
    { label: 'IP Rating', pattern: /ip rating/i },
    { label: 'CCT', pattern: /cct|colour temperature/i },
    { label: 'Beam Angle', pattern: /beam angle/i },
  ];
  const stats = [];
  for (const { label, pattern } of patterns) {
    const spec = specs.find((row) => pattern.test(row.label));
    if (!spec) continue;
    stats.push({ label, value: spec.value, unit: '' });
    if (stats.length >= 4) break;
  }
  return stats;
};

const STAT_PRIORITY = [
  { pattern: /^(power|wattage)$/i },
  { pattern: /lumens|luminous flux/i },
  { pattern: /ip rating/i },
  { pattern: /cct|colour temperature/i },
  { pattern: /efficacy/i },
  { pattern: /beam angle/i },
];

/**
 * Three values fit the A4 stat row cleanly; range values such as 900-36000
 * break mid-number when four share the width. Pick the three most useful.
 */
const pickStats = (source, specs) => {
  const available = source.length > 0 ? source : deriveStats(specs);
  const picked = [];
  for (const { pattern } of STAT_PRIORITY) {
    const found = available.find((stat) => pattern.test(String(stat.label || '').trim()));
    if (found && !picked.includes(found)) picked.push(found);
    if (picked.length >= 3) break;
  }
  for (const stat of available) {
    if (picked.length >= 3) break;
    if (!picked.includes(stat)) picked.push(stat);
  }
  return picked.slice(0, 3);
};

/** Fallback two-column layout for a hand-entered product. */
const deriveColumns = (specs, product) => {
  const buckets = {
    physical: [],
    compliance: [],
    technical: [],
    electrical: [],
    product: [],
  };

  for (const spec of specs) {
    const label = spec.label.toLowerCase();
    if (/operating voltage|voltage|frequency|power factor|dimming|driver|control options|surge|harmonic|thd/.test(label)) {
      buckets.electrical.push(spec);
    } else if (/dimension|cutout|housing|material|finish|mount|beam|weight|colour|color|optic|power connection|size/.test(label)) {
      buckets.physical.push(spec);
    } else if (/ip rating|ik rating|warranty|certif|lifetime|led colour consistency|fire rating|electrical safety|interference|light quality/.test(label)) {
      buckets.compliance.push(spec);
    } else if (/manufacturer|product code|model|optional add-on/.test(label)) {
      buckets.product.push(spec);
    } else {
      buckets.technical.push(spec);
    }
  }

  if (hasValue(product.manufacturer) && !hasLabel(buckets.product, /^manufacturer$/i)) {
    buckets.product.push({ label: 'Manufacturer', value: product.manufacturer });
  }
  if (hasValue(product.manufacturerModel) && !hasLabel(buckets.product, /product code|model/i)) {
    buckets.product.push({ label: 'Product Code', value: product.manufacturerModel });
  }

  const left = [
    { title: 'Physical', rows: buckets.physical },
    { title: 'Compliance', rows: buckets.compliance },
    { title: 'Technical Data', rows: buckets.technical },
  ].filter((group) => group.rows.length > 0);

  const right = [
    { title: 'Product Information', rows: buckets.product },
    { title: 'Electrical', rows: buckets.electrical },
  ].filter((group) => group.rows.length > 0);

  return { left, right };
};

/**
 * The left column carries the overview, features and applications, so it is
 * naturally taller than the right. When both columns have tables, moving the
 * last left-hand table across balances the page and avoids spilling the final
 * table onto a second A4 sheet.
 */
const balanceColumns = (columns) => {
  const left = columns.left.map((group) => ({ ...group }));
  const right = columns.right.map((group) => ({ ...group }));
  if (left.length >= 3 && right.length <= 2) {
    const moved = left.pop();
    if (moved) right.push(moved);
  }
  return { left, right };
};

const sanitiseFileStem = (value, fallback) => {
  const stem = String(value || '')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
  return stem || fallback || 'Product';
};

/**
 * Build the full template payload.
 *
 * product: the public/admin product view (name, summary, specs, images, ...)
 * categoryTitle: the human category title
 * datasheet: optional normalized draft from the AI import
 */
export const buildDatasheetData = ({ product, categoryTitle, datasheet = null }) => {
  const specs = normalizeSpecs(product.specs);
  // The A4 template is a one-page summary. The full lists stay on the product
  // page; keeping these short is what stops the sheet spilling onto page two.
  const features = normalizeStrings(product.features, 30, 300).slice(0, 6);
  const applications = normalizeStrings(product.applications, 30, 300).slice(0, 6);
  const draft = normalizeDatasheet(datasheet);
  const summary = String(product.summary || '').trim();
  const description = String(product.description || '').trim();
  const variant =
    draft?.variant ||
    summary ||
    (categoryTitle ? categoryTitle + ' product' : 'LumenX product');
  const overview = [description || summary || variant].filter(Boolean);
  const mainImage = product.mainImage || product.images?.[0]?.src || product.imageUrl || '';
  const stats = pickStats(draft?.stats?.length ? draft.stats : [], specs);

  // Use the AI's curated layout when it is concise. A verbose draft (many rows)
  // is replaced with the compact deterministic grouping so the branded sheet
  // stays on one page; the full spec table remains on the product page.
  const derivedColumns = deriveColumns(specs, product);
  const aiRowCount = draft
    ? draft.columns.left.reduce((total, group) => total + group.rows.length, 0) +
      draft.columns.right.reduce((total, group) => total + group.rows.length, 0)
    : 0;
  const columns = balanceColumns(
    draft && aiRowCount > 0 && aiRowCount <= 20 ? draft.columns : derivedColumns,
  );

  return {
    fileStem: sanitiseFileStem(product.name, product.slug),
    meta: { rev: '1.0' },
    name: String(product.name || 'LumenX product'),
    category: String(categoryTitle || '').toUpperCase(),
    variant,
    stats,
    heroImage: {
      src: toTemplateSrc(mainImage),
      alt: String(product.name || 'LumenX product'),
    },
    overview,
    features,
    applications,
    columns,
    drawing: { src: '', alt: 'Dimension drawing' },
    notes: base().notes,
    contact: base().contact,
  };
};
