import { Product, ProductCategory, ProductImage } from './types';
import { SCRAPED_CATEGORIES, SCRAPED_PRODUCTS } from './catalogue-scraped';

/**
 * LumenX product catalogue — rebuilt from the supplier scrape.
 *
 * The product data, descriptions, spec tables, supplier photos and datasheets
 * come from `data-scrape/products` (regenerate with
 * `python3 data-scrape/generate_catalogue.py`, which re-emits
 * `src/catalogue-scraped.ts`). Every product carries an ordered `images` array
 * (hero first) used by the product-page carousel.
 */

/* ── Categories ── */
export const PRODUCT_CATEGORIES: ProductCategory[] = SCRAPED_CATEGORIES;

/* ── Products ── */
export const PRODUCTS: Product[] = SCRAPED_PRODUCTS;

/** Products grouped by category id (derived). */
export const PRODUCTS_BY_CATEGORY: Record<string, Product[]> = PRODUCTS.reduce(
  (acc, product) => {
    (acc[product.category] ||= []).push(product);
    return acc;
  },
  {} as Record<string, Product[]>,
);

export function getCategory(categoryId: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((c) => c.id === categoryId);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return PRODUCTS_BY_CATEGORY[categoryId] || [];
}

export function getProduct(categoryId: string, slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.category === categoryId && p.slug === slug);
}

/** Ordered gallery for a product (hero first); falls back to the single image. */
export function getProductImages(product: Product): ProductImage[] {
  if (product.images && product.images.length > 0) return product.images;
  return [{ src: product.imageUrl, fit: 'contain' as const }];
}

/**
 * Convert a datasheet path into the tracked backend download URL so every
 * download is recorded. Static files (/datasheets/X.pdf) map onto the legacy
 * file route; generated datasheets already carry their /api/ URL and pass
 * straight through.
 */
export const datasheetDownloadUrl = (pdfUrl: string): string => {
  if (pdfUrl.startsWith('/api/')) return pdfUrl;
  const name = pdfUrl.split('/').filter(Boolean).pop() || '';
  return `/api/download/datasheet/${encodeURIComponent(name)}`;
};

/** Flat list of all unique local datasheet downloads. */
export function getAllDatasheets(): { name: string; href: string }[] {
  const seen = new Set<string>();
  const sheets: { name: string; href: string }[] = [];
  PRODUCTS.forEach((p) => {
    if (p.pdfUrl && !seen.has(p.pdfUrl)) {
      seen.add(p.pdfUrl);
      sheets.push({ name: p.name, href: p.pdfUrl });
    }
  });
  return sheets.sort((a, b) => a.name.localeCompare(b.name));
}

/** Complete local datasheet library (LumenX-branded + supplier-linked ranges). */
export const DATASHEET_LIBRARY: { name: string; href: string }[] = getAllDatasheets();

/** A single datasheet entry carrying its product category for grouping. */
export interface DatasheetEntry {
  name: string;
  href: string;
  category: string;
}

/** A category group within the datasheet library. */
export interface DatasheetCategoryGroup {
  categoryId: string;
  title: string;
  sheets: DatasheetEntry[];
}

/**
 * Datasheet library grouped by product category, ordered to match the
 * catalogue. Each unique datasheet appears once, under the first product
 * category that references it.
 */
export const DATASHEET_LIBRARY_BY_CATEGORY: DatasheetCategoryGroup[] = (() => {
  const seen = new Set<string>();
  const groups = new Map<string, DatasheetCategoryGroup>();
  for (const category of PRODUCT_CATEGORIES) {
    groups.set(category.id, { categoryId: category.id, title: category.title, sheets: [] });
  }
  for (const product of PRODUCTS) {
    if (!product.pdfUrl || seen.has(product.pdfUrl)) continue;
    seen.add(product.pdfUrl);
    const group = groups.get(product.category);
    if (!group) continue;
    group.sheets.push({ name: product.name, href: product.pdfUrl, category: product.category });
  }
  return [...groups.values()]
    .filter((group) => group.sheets.length > 0)
    .map((group) => ({
      ...group,
      sheets: group.sheets.sort((a, b) => a.name.localeCompare(b.name)),
    }));
})();
