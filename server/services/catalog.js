// Catalogue overlay service.
//
// The base catalogue is compiled into the frontend (src/catalogue-*.ts). This
// service owns only the PostgreSQL overlay: admin-created categories/products
// and overrides for base entries. The SPA merges the two at runtime.
//
// All writes are admin-gated at the router; this module is responsible for
// validation, normalisation and the snake_case <-> camelCase boundary.

import { query, queryOne } from '../db.js';
import {
  isSafeMediaUrl,
  parseDimension,
  slugify,
} from './uploads.js';

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
export const CATEGORY_RANGES = new Set(['lighting', 'sensors']);
export const PDF_SOURCES = new Set(['none', 'uploaded', 'generated']);

const MAX_SPECS = 40;
const MAX_IMAGES = 20;
const MAX_FEATURES = 30;
const MAX_APPLICATIONS = 30;
const MAX_DATASHEET_GROUPS = 5;
const MAX_DATASHEET_ROWS = 8;

const short = (value, max) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const long = (value, max) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);

const asArray = (value) => (Array.isArray(value) ? value : []);

const httpError = (message, status = 400) => Object.assign(new Error(message), { status });

/* ── Normalisation ─────────────────────────────────────────────────────── */

export const normalizeSpecs = (value) => {
  const seen = new Set();
  const specs = [];
  for (const entry of asArray(value)) {
    if (!entry || typeof entry !== 'object') continue;
    const label = short(entry.label, 200);
    const specValue = short(entry.value, 500);
    if (!label || !specValue) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    specs.push({ label, value: specValue });
    if (specs.length >= MAX_SPECS) break;
  }
  return specs;
};

export const normalizeStrings = (value, maxItems = MAX_FEATURES, maxLength = 300) => {
  const seen = new Set();
  const items = [];
  for (const entry of asArray(value)) {
    const item = short(entry, maxLength);
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length >= maxItems) break;
  }
  return items;
};

export const normalizeImages = (value) => {
  const seen = new Set();
  const images = [];
  for (const entry of asArray(value)) {
    if (!entry || typeof entry !== 'object') continue;
    const src = typeof entry.src === 'string' ? entry.src.trim() : '';
    if (!isSafeMediaUrl(src) || seen.has(src)) continue;
    seen.add(src);
    const image = {
      src,
      alt: short(entry.alt, 300) || undefined,
      fit: entry.fit === 'cover' ? 'cover' : 'contain',
      width: parseDimension(entry.width) || undefined,
      height: parseDimension(entry.height) || undefined,
    };
    images.push(image);
    if (images.length >= MAX_IMAGES) break;
  }
  return images;
};

const normalizeDatasheetGroup = (group) => {
  if (!group || typeof group !== 'object') return null;
  const title = short(group.title, 80);
  const rows = [];
  for (const row of asArray(group.rows)) {
    if (!row || typeof row !== 'object') continue;
    const label = short(row.label, 200);
    const value = short(row.value, 500);
    if (!label || !value) continue;
    rows.push({ label, value });
    if (rows.length >= MAX_DATASHEET_ROWS) break;
  }
  return title && rows.length > 0 ? { title, rows } : null;
};

export const normalizeDatasheet = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const stats = [];
  for (const stat of asArray(value.stats)) {
    if (!stat || typeof stat !== 'object') continue;
    const label = short(stat.label, 100);
    const statValue = short(stat.value, 120);
    if (!label || !statValue) continue;
    stats.push({ label, value: statValue, unit: short(stat.unit, 20) || '' });
    if (stats.length >= 4) break;
  }
  const columns = value.columns && typeof value.columns === 'object' ? value.columns : {};
  const left = asArray(columns.left).map(normalizeDatasheetGroup).filter(Boolean).slice(0, MAX_DATASHEET_GROUPS);
  const right = asArray(columns.right).map(normalizeDatasheetGroup).filter(Boolean).slice(0, MAX_DATASHEET_GROUPS);
  const variant = short(value.variant, 300);
  if (!variant && stats.length === 0 && left.length === 0 && right.length === 0) return null;
  return { variant: variant || undefined, stats, columns: { left, right } };
};

/* ── Views ─────────────────────────────────────────────────────────────── */

const generatedDatasheetUrl = (category, slug) =>
  `/api/download/datasheet/product/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;

export const productView = (row, { admin = false } = {}) => {
  const images = normalizeImages(row.images);
  const mainImage = images.some((image) => image.src === row.main_image)
    ? row.main_image
    : images[0]?.src ?? '';
  const pdfSource = PDF_SOURCES.has(row.pdf_source) ? row.pdf_source : 'none';
  const pdfUrl =
    pdfSource === 'generated'
      ? generatedDatasheetUrl(row.category_id, row.slug)
      : pdfSource === 'uploaded' && isSafeMediaUrl(row.pdf_url)
        ? row.pdf_url
        : null;

  const view = {
    slug: row.slug,
    category: row.category_id,
    name: row.name,
    summary: row.summary || '',
    description: row.description || '',
    specs: normalizeSpecs(row.specs),
    features: normalizeStrings(row.features),
    applications: normalizeStrings(row.applications),
    images,
    mainImage: mainImage || undefined,
    imageUrl: mainImage || '',
    pdfUrl: pdfUrl || undefined,
    pdfName: row.pdf_name || undefined,
    pdfSource,
    warranty: row.warranty || undefined,
    brand: row.brand || undefined,
    manufacturer: row.manufacturer || undefined,
    manufacturerModel: row.manufacturer_model || undefined,
    source: 'db',
    updatedAt: row.updated_at,
  };

  if (admin) {
    view.id = row.id;
    view.datasheet = row.datasheet ?? null;
    view.sourceImportId = row.source_import_id ?? null;
  }

  return view;
};

export const categoryView = (row, { admin = false } = {}) => {
  const view = {
    id: row.id,
    title: row.title,
    description: row.description || '',
    applications: row.applications || '',
    imageUrl: row.image_url || '',
    linkLabel: row.link_label || 'View Range',
    range: row.category_range === 'sensors' ? 'sensors' : 'lighting',
    sortOrder: Number(row.sort_order) || 0,
    source: 'db',
    updatedAt: row.updated_at,
  };
  if (admin) view.updatedBy = row.updated_by ?? null;
  return view;
};

export const listCatalog = async ({ admin = false } = {}) => {
  const [categories, products] = await Promise.all([
    query('SELECT * FROM catalog_categories ORDER BY sort_order ASC, title ASC'),
    query('SELECT * FROM catalog_products ORDER BY category_id ASC, name ASC'),
  ]);
  return {
    categories: categories.rows.map((row) => categoryView(row, { admin })),
    products: products.rows.map((row) => productView(row, { admin })),
  };
};

export const getProductRow = async (category, slug) =>
  queryOne('SELECT * FROM catalog_products WHERE category_id = $1 AND slug = $2', [category, slug]);

export const getCategoryRow = async (id) =>
  queryOne('SELECT * FROM catalog_categories WHERE id = $1', [id]);

/* ── Validation ────────────────────────────────────────────────────────── */

const safePdfUrl = (value) => (isSafeMediaUrl(value) ? value : null);

export const validateProductInput = (body, { category, slug }) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw httpError('Product data must be a JSON object.');
  }
  if (!SLUG_RE.test(category) || !SLUG_RE.test(slug)) {
    throw httpError('A valid category and product slug are required.');
  }
  const name = short(body.name, 200);
  if (!name) throw httpError('Product name is required.');

  const images = normalizeImages(body.images);
  const mainImage = images.some((image) => image.src === body.mainImage)
    ? body.mainImage
    : images[0]?.src ?? null;

  let pdfSource = PDF_SOURCES.has(body.pdfSource) ? body.pdfSource : 'none';
  let pdfUrl = null;
  if (pdfSource === 'uploaded') {
    pdfUrl = safePdfUrl(body.pdfUrl);
    if (!pdfUrl) throw httpError('An uploaded spec sheet must have a valid URL.');
  } else if (pdfSource === 'none') {
    pdfUrl = null;
  } else {
    pdfUrl = null;
  }

  const sourceImportId =
    typeof body.sourceImportId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.sourceImportId)
      ? body.sourceImportId
      : null;

  return {
    name,
    summary: short(body.summary, 600),
    description: long(body.description, 10000),
    specs: normalizeSpecs(body.specs),
    features: normalizeStrings(body.features),
    applications: normalizeStrings(body.applications, MAX_APPLICATIONS),
    images,
    mainImage,
    pdfUrl,
    pdfName: short(body.pdfName, 200) || null,
    pdfSource,
    warranty: short(body.warranty, 300) || null,
    brand: short(body.brand, 60) || null,
    manufacturer: short(body.manufacturer, 200) || null,
    manufacturerModel: short(body.manufacturerModel, 200) || null,
    datasheet: pdfSource === 'generated' ? normalizeDatasheet(body.datasheet) : null,
    sourceImportId,
  };
};

export const validateCategoryInput = (body, { id } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw httpError('Category data must be a JSON object.');
  }
  const title = short(body.title, 120);
  if (!title) throw httpError('Category name is required.');
  const categoryId = short(id || body.id || slugify(title), 80);
  if (!SLUG_RE.test(categoryId)) {
    throw httpError('A valid category ID is required (lowercase letters, numbers and dashes).');
  }
  return {
    id: categoryId,
    title,
    description: long(body.description, 1200),
    applications: long(body.applications, 1200),
    imageUrl: isSafeMediaUrl(body.imageUrl) ? body.imageUrl.trim() : null,
    linkLabel: short(body.linkLabel, 60) || 'View Range',
    range: CATEGORY_RANGES.has(body.range) ? body.range : 'lighting',
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
  };
};

/* ── Category writes ───────────────────────────────────────────────────── */

export const createCategory = async (input, updatedBy) => {
  const result = await query(
    `INSERT INTO catalog_categories (id, title, description, applications, image_url, link_label, category_range, sort_order, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      input.id,
      input.title,
      input.description,
      input.applications,
      input.imageUrl,
      input.linkLabel,
      input.range,
      input.sortOrder,
      updatedBy,
    ],
  );
  if (!result.rows[0]) throw httpError(`A category with the ID "${input.id}" already exists.`, 409);
  return categoryView(result.rows[0], { admin: true });
};

export const updateCategory = async (input, updatedBy) => {
  const result = await query(
    `INSERT INTO catalog_categories (id, title, description, applications, image_url, link_label, category_range, sort_order, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       applications = EXCLUDED.applications,
       image_url = EXCLUDED.image_url,
       link_label = EXCLUDED.link_label,
       category_range = EXCLUDED.category_range,
       sort_order = EXCLUDED.sort_order,
       updated_by = EXCLUDED.updated_by,
       updated_at = now()
     RETURNING *`,
    [
      input.id,
      input.title,
      input.description,
      input.applications,
      input.imageUrl,
      input.linkLabel,
      input.range,
      input.sortOrder,
      updatedBy,
    ],
  );
  return categoryView(result.rows[0], { admin: true });
};

export const deleteCategory = async (id) => {
  const used = await queryOne('SELECT COUNT(*)::int AS count FROM catalog_products WHERE category_id = $1', [id]);
  if (used && used.count > 0) {
    throw httpError('This category still has products. Move or delete them first.', 409);
  }
  const result = await query('DELETE FROM catalog_categories WHERE id = $1 RETURNING id', [id]);
  if (!result.rows[0]) throw httpError('Category not found.', 404);
  return true;
};

/* ── Product writes ────────────────────────────────────────────────────── */

const productParams = (input) => [
  input.name,
  input.summary,
  input.description,
  JSON.stringify(input.specs),
  JSON.stringify(input.features),
  JSON.stringify(input.applications),
  JSON.stringify(input.images),
  input.mainImage,
  input.pdfUrl,
  input.pdfName,
  input.pdfSource,
  input.warranty,
  input.brand,
  input.manufacturer,
  input.manufacturerModel,
  input.datasheet ? JSON.stringify(input.datasheet) : null,
  input.sourceImportId,
];

export const createProduct = async ({ category, slug, input, updatedBy }) => {
  const result = await query(
    `INSERT INTO catalog_products
       (category_id, slug, name, summary, description, specs, features, applications, images,
        main_image, pdf_url, pdf_name, pdf_source, warranty, brand, manufacturer, manufacturer_model,
        datasheet, source_import_id, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     ON CONFLICT (category_id, slug) DO NOTHING
     RETURNING *`,
    [category, slug, ...productParams(input), updatedBy],
  );
  if (!result.rows[0]) {
    throw httpError(`A product with the slug "${slug}" already exists in this category.`, 409);
  }
  return productView(result.rows[0], { admin: true });
};

export const updateProduct = async ({ category, slug, input, updatedBy }) => {
  const result = await query(
    `INSERT INTO catalog_products
       (category_id, slug, name, summary, description, specs, features, applications, images,
        main_image, pdf_url, pdf_name, pdf_source, warranty, brand, manufacturer, manufacturer_model,
        datasheet, source_import_id, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     ON CONFLICT (category_id, slug) DO UPDATE SET
       name = EXCLUDED.name,
       summary = EXCLUDED.summary,
       description = EXCLUDED.description,
       specs = EXCLUDED.specs,
       features = EXCLUDED.features,
       applications = EXCLUDED.applications,
       images = EXCLUDED.images,
       main_image = EXCLUDED.main_image,
       pdf_url = EXCLUDED.pdf_url,
       pdf_name = EXCLUDED.pdf_name,
       pdf_source = EXCLUDED.pdf_source,
       warranty = EXCLUDED.warranty,
       brand = EXCLUDED.brand,
       manufacturer = EXCLUDED.manufacturer,
       manufacturer_model = EXCLUDED.manufacturer_model,
       datasheet = EXCLUDED.datasheet,
       source_import_id = EXCLUDED.source_import_id,
       updated_by = EXCLUDED.updated_by,
       updated_at = now()
     RETURNING *`,
    [category, slug, ...productParams(input), updatedBy],
  );
  return productView(result.rows[0], { admin: true });
};

export const deleteProduct = async (category, slug) => {
  const result = await query(
    'DELETE FROM catalog_products WHERE category_id = $1 AND slug = $2 RETURNING id',
    [category, slug],
  );
  if (!result.rows[0]) throw httpError('Product not found.', 404);
  return true;
};

export const countProductsInCategory = async (category) => {
  const row = await queryOne('SELECT COUNT(*)::int AS count FROM catalog_products WHERE category_id = $1', [category]);
  return row?.count ?? 0;
};
