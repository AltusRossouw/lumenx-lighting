// Catalogue overlay routes.
//
//   GET  /api/catalog                       public: DB categories + products
//   GET  /api/admin/catalog                 admin: same rows with write metadata
//   POST /api/admin/catalog/categories      create a category
//   PUT  /api/admin/catalog/categories/:id  create/update an override
//   DELETE /api/admin/catalog/categories/:id
//   POST /api/admin/catalog/products        create a product
//   PUT  /api/admin/catalog/products/:category/:slug
//   DELETE /api/admin/catalog/products/:category/:slug
//   POST /api/admin/catalog/upload/image    raw PNG/JPEG/WebP
//   POST /api/admin/catalog/upload/spec-sheet raw PDF
//
// All writes are admin-gated. Uploads are raw octet-stream bodies (the same
// pattern as the existing IES upload), so no multipart dependency is needed.

import express, { Router } from 'express';
import fs from 'node:fs';
import { requireAdmin } from '../middleware/auth.js';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listCatalog,
  setProductVisibility,
  normalizeImages,
  normalizeSpecs,
  normalizeStrings,
  updateCategory,
  updateProduct,
  validateCategoryInput,
  validateProductInput,
  SLUG_RE,
} from '../services/catalog.js';
import { saveImage, saveSpecSheet, slugify } from '../services/uploads.js';
import { logActivity } from '../services/activity.js';
import { buildDatasheetData, categoryTitleFor } from '../services/datasheet-product.js';
import { renderDatasheetData } from '../services/datasheet-pdf.js';

const rawImage = express.raw({ type: () => true, limit: '12mb' });
const rawPdf = express.raw({ type: () => true, limit: '25mb' });

const uploadBodyError = (err, _req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'That file is larger than the upload limit.' });
  }
  if (err?.status >= 400 && err?.status < 500) {
    return res.status(err.status).json({ error: 'The upload could not be read.' });
  }
  return next(err);
};

const sendError = (err, res, next) => {
  if (err?.status) return res.status(err.status).json({ error: err.message });
  return next(err);
};

const actor = (req) => req.user?.email ?? 'admin-key';

export const catalogPublicRouter = () => {
  const router = Router();

  // Public catalogue overlay. The SPA merges this over its static catalogue;
  // an empty array is a perfectly valid response.
  router.get('/catalog', async (_req, res, next) => {
    try {
      const { categories, products } = await listCatalog();
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ categories, products });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};

export const catalogAdminRouter = () => {
  const router = Router();

  // Everything below is admin-only.
  router.use(requireAdmin);

  // Admin list (includes datasheet JSON and provenance not sent to the public).
  router.get('/', async (_req, res, next) => {
    try {
      const { categories, products } = await listCatalog({ admin: true });
      return res.json({ categories, products });
    } catch (err) {
      return next(err);
    }
  });

  // ── Categories ────────────────────────────────────────────────────────

  router.post('/categories', async (req, res, next) => {
    try {
      const input = validateCategoryInput(req.body);
      const category = await createCategory(input, actor(req));
      await logActivity(req, {
        action: 'catalog.category.create',
        entityType: 'category',
        entityId: category.id,
        summary: `Created category "${category.title}"`,
        metadata: { categoryId: category.id },
      });
      return res.status(201).json({ ok: true, category });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.put('/categories/:id', async (req, res, next) => {
    try {
      const input = validateCategoryInput(req.body, { id: String(req.params.id ?? '').trim() });
      const category = await updateCategory(input, actor(req));
      await logActivity(req, {
        action: 'catalog.category.update',
        entityType: 'category',
        entityId: category.id,
        summary: `Updated category "${category.title}"`,
        metadata: { categoryId: category.id },
      });
      return res.json({ ok: true, category });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.delete('/categories/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id ?? '').trim();
      await deleteCategory(id);
      await logActivity(req, {
        action: 'catalog.category.delete',
        entityType: 'category',
        entityId: id,
        summary: 'Deleted category ' + id,
      });
      return res.json({ ok: true });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  // ── Products ──────────────────────────────────────────────────────────

  router.post('/products', async (req, res, next) => {
    try {
      const category = String(req.body?.category ?? '').trim();
      const slug = String(req.body?.slug ?? '').trim() || slugify(req.body?.name);
      if (!SLUG_RE.test(category) || !SLUG_RE.test(slug)) {
        return res.status(400).json({ error: 'A valid category and product slug are required.' });
      }
      const input = validateProductInput(req.body, { category, slug });
      const product = await createProduct({ category, slug, input, updatedBy: actor(req) });
      await logActivity(req, {
        action: 'catalog.product.create',
        entityType: 'product',
        entityId: category + '/' + slug,
        summary: `Created product "${product.name}"`,
        metadata: { category, slug },
      });
      return res.status(201).json({ ok: true, product });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.put('/products/:category/:slug', async (req, res, next) => {
    try {
      const category = String(req.params.category ?? '').trim();
      const slug = String(req.params.slug ?? '').trim();
      if (!SLUG_RE.test(category) || !SLUG_RE.test(slug)) {
        return res.status(400).json({ error: 'A valid category and product slug are required.' });
      }
      const input = validateProductInput(req.body, { category, slug });
      const product = await updateProduct({ category, slug, input, updatedBy: actor(req) });
      await logActivity(req, {
        action: 'catalog.product.update',
        entityType: 'product',
        entityId: category + '/' + slug,
        summary: `Updated product "${product.name}"`,
        metadata: { category, slug },
      });
      return res.json({ ok: true, product });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  // PUT /products/:category/:slug/visibility — hide/show without deleting.
  // Existing rows update only the flag; a base product is copied into an
  // override on first hide so its URL and IES mapping stay stable.
  router.put('/products/:category/:slug/visibility', async (req, res, next) => {
    try {
      const category = String(req.params.category ?? '').trim();
      const slug = String(req.params.slug ?? '').trim();
      if (!SLUG_RE.test(category) || !SLUG_RE.test(slug)) {
        return res.status(400).json({ error: 'A valid category and product slug are required.' });
      }
      const product = await setProductVisibility({
        category,
        slug,
        published: req.body?.published,
        product: req.body?.product,
        updatedBy: actor(req),
      });
      const published = product.published !== false;
      await logActivity(req, {
        action: 'catalog.product.visibility',
        entityType: 'product',
        entityId: category + '/' + slug,
        summary: (published ? 'Published' : 'Hid') + ' product "' + product.name + '"',
        metadata: { category, slug, published },
      });
      return res.json({ ok: true, product });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.delete('/products/:category/:slug', async (req, res, next) => {
    try {
      const category = String(req.params.category ?? '').trim();
      const slug = String(req.params.slug ?? '').trim();
      await deleteProduct(category, slug);
      await logActivity(req, {
        action: 'catalog.product.delete',
        entityType: 'product',
        entityId: category + '/' + slug,
        summary: 'Deleted product ' + category + '/' + slug,
        metadata: { category, slug },
      });
      return res.json({ ok: true });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  // ── Datasheet preview ─────────────────────────────────────────────────
  //
  // Render the branded LumenX A4 sheet from the current (unsaved) product
  // draft. This is a review aid: it writes no product row and records no
  // download. The public generated route is in routes/downloads.js.
  router.post('/datasheet/preview', async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'A product name is required for a preview.' });

      const product = {
        name,
        slug: String(body.slug ?? 'draft').trim() || 'draft',
        category: String(body.category ?? '').trim(),
        summary: String(body.summary ?? '').trim(),
        description: String(body.description ?? '').trim(),
        specs: normalizeSpecs(body.specs),
        features: normalizeStrings(body.features),
        applications: normalizeStrings(body.applications),
        images: normalizeImages(body.images),
        mainImage: body.mainImage || null,
        imageUrl: body.imageUrl || '',
        manufacturer: String(body.manufacturer ?? '').trim() || null,
        manufacturerModel: String(body.manufacturerModel ?? '').trim() || null,
        brand: String(body.brand ?? '').trim() || null,
      };

      const categoryTitle = await categoryTitleFor(product.category, body.categoryTitle ?? null);
      const data = buildDatasheetData({
        product,
        categoryTitle,
        datasheet: body.datasheet ?? null,
      });
      const result = await renderDatasheetData({
        key: 'preview-' + (slugify(product.slug) || 'draft'),
        data,
      });
      if (!result) return res.status(500).json({ error: 'Could not render the datasheet.' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + result.filename.replace(/"/g, '') + '"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      return fs.createReadStream(result.file).on('error', next).pipe(res);
    } catch (err) {
      if (String(err?.message || '').includes('Chrome') || String(err?.message || '').includes('Chromium')) {
        return res.status(503).json({ error: 'The datasheet renderer is unavailable on this server.' });
      }
      return next(err);
    }
  });

  // ── Uploads ───────────────────────────────────────────────────────────
  //
  // The body is raw bytes; metadata travels in the query string. Files are
  // validated by magic bytes in services/uploads.js and stored under
  // uploads/products or uploads/categories, which are the only public upload
  // directories.

  router.post('/upload/image', rawImage, uploadBodyError, async (req, res, next) => {
    try {
      const scope = req.query.scope === 'category' ? 'category' : 'product';
      const slug = String(req.query.slug ?? '').trim() || 'image';
      const filename = String(req.query.filename ?? '').trim();
      const image = await saveImage({
        buffer: req.body,
        scope,
        slug,
        width: req.query.width,
        height: req.query.height,
      });
      await logActivity(req, {
        action: 'catalog.image.upload',
        entityType: 'image',
        entityId: image.filename,
        summary: `Uploaded ${scope} image for ${slug}`,
        metadata: { scope, slug, filename: image.filename, bytes: image.bytes, mime: image.mime },
      });
      return res.status(201).json({ ok: true, image: { ...image, originalName: filename || null } });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  router.post('/upload/spec-sheet', rawPdf, uploadBodyError, async (req, res, next) => {
    try {
      const slug = String(req.query.slug ?? '').trim() || 'spec-sheet';
      const originalName = String(req.query.filename ?? '').trim();
      const pdf = await saveSpecSheet({ buffer: req.body, slug, originalName });
      await logActivity(req, {
        action: 'catalog.spec_sheet.upload',
        entityType: 'spec-sheet',
        entityId: pdf.filename,
        summary: `Uploaded spec sheet for ${slug}`,
        metadata: { slug, filename: pdf.filename, originalName: pdf.originalName },
      });
      return res.status(201).json({ ok: true, pdf });
    } catch (err) {
      return sendError(err, res, next);
    }
  });

  return router;
};
