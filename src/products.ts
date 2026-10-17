import { Product, ProductCategory, ProductImage } from './types';
import { SCRAPED_CATEGORIES } from './catalogue-scraped';
import { ALL_PRODUCTS } from './catalogue-full';
import { IES_PRODUCT_MAP } from './ies-product-map';

/**
 * LumenX product catalogue.
 *
 * The whole scraped range is published. Curated entries that carry a finished
 * LumenX datasheet live in `official-products.ts`; the remainder come from
 * `catalogue-full.ts` and have no datasheet yet — their product pages simply
 * omit the download button.
 *
 * Every product carries an ordered `images` array (hero first) used by the
 * product-page carousel, headed by its tile from `make-product-tiles.py`.
 */

/** Neutral fallback for a product/category that has no image yet. */
export const PLACEHOLDER_PRODUCT_IMAGE = '/product-images/placeholder.svg';

/* ── Categories ── */
/**
 * Every catalogue category is published, not only the ones that already carry
 * products. The range is being built out category by category, and a category
 * with no products yet renders the "Range details coming soon" state on
 * ProductDetailPage rather than 404ing.
 */
export const PRODUCT_CATEGORIES: ProductCategory[] = SCRAPED_CATEGORIES;

/** Sensors are not luminaires, so they sit above the "Lighting Solutions" heading. */
const NON_LIGHTING_CATEGORY_IDS = new Set(['sensors']);

export const SENSOR_CATEGORIES: ProductCategory[] = PRODUCT_CATEGORIES.filter((category) =>
  NON_LIGHTING_CATEGORY_IDS.has(category.id),
);

export const LIGHTING_CATEGORIES: ProductCategory[] = PRODUCT_CATEGORIES.filter(
  (category) => !NON_LIGHTING_CATEGORY_IDS.has(category.id),
);

/* ── Products ── */
export const PRODUCTS: Product[] = ALL_PRODUCTS;

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

/* ── Brands ─────────────────────────────────────────────────────────────────
 * OrbitX and LumenX have a partnership, so OrbitX fittings are published under
 * the OrbitX name. The slug never changes — 118 product URLs stay stable — only
 * the display name gains the prefix. `src/product-tiles.ts` and the sitemap
 * both read the plain `name`, so the prefix is a render-time concern.
 */
const BRAND_LABELS: Record<string, string> = {
  orbitx: 'OrbitX',
};

/** 'orbitx' -> 'OrbitX'; an unknown id is title-cased rather than hidden. */
export function brandLabel(brand: string): string {
  return (
    BRAND_LABELS[brand] ??
    brand.replace(/(^|[\s-])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`)
  );
}

/** The name to render: `OrbitX Neptune`, or the plain name for LumenX's own. */
export function displayName(product: Pick<Product, 'name' | 'brand'>): string {
  return product.brand ? `${brandLabel(product.brand)} ${product.name}` : product.name;
}

/**
 * Catalogue order within a category: partner-branded fittings first, then
 * everything else, each group alphabetical.
 *
 * The client asked for OrbitX at the top — "Orbitex is supposed to be on the
 * top" — and this is applied inside `getProductsByCategory` so every consumer
 * inherits it in one place: the category grid, prev/next on product pages, the
 * datasheet library and the sitemap.
 */
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const branded = Number(Boolean(b.brand)) - Number(Boolean(a.brand));
    if (branded !== 0) return branded;
    return a.name.localeCompare(b.name);
  });
}

export function getProductsByCategory(categoryId: string): Product[] {
  return sortProducts(PRODUCTS_BY_CATEGORY[categoryId] || []);
}

export function getProduct(categoryId: string, slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.category === categoryId && p.slug === slug);
}

/**
 * Ordered gallery for a product (hero first).
 *
 * The admin's explicit main image is moved to the front here, so every
 * consumer - cards, gallery, datasheets - uses the same hero without each one
 * re-implementing the rule. Products without an image fall back to the brand
 * placeholder rather than rendering a broken image element.
 */
export function getProductImages(product: Product): ProductImage[] {
  const stored = (product.images ?? []).filter((image) => image && image.src);
  const images: ProductImage[] =
    stored.length > 0
      ? stored
      : [{ src: product.imageUrl || PLACEHOLDER_PRODUCT_IMAGE, fit: 'contain' as const }];

  const main = product.mainImage || product.imageUrl;
  if (main) {
    const index = images.findIndex((image) => image.src === main);
    if (index > 0) return [images[index], ...images.slice(0, index), ...images.slice(index + 1)];
  }
  return images;
}

/**
 * Convert a datasheet path into the tracked backend download URL so every
 * download is recorded. Static files (/datasheets/X.pdf) map onto the legacy
 * file route; generated datasheets already carry their /api/ URL and pass
 * straight through.
 */
export const datasheetDownloadUrl = (pdfUrl: string): string => {
  if (pdfUrl.startsWith('/api/') || pdfUrl.startsWith('/catalogues/')) return pdfUrl;
  const name = pdfUrl.split('/').filter(Boolean).pop() || '';
  return `/api/download/datasheet/${encodeURIComponent(name)}`;
};

/**
 * Turn an IES filename into a readable variant label.
 *
 * Files in `server/files/ies/` are slugified on import, so
 * `lumenx-ies-file-of-120d-4000k-160w-ufo-hbay.ies` has to become something a
 * specifier can choose between. Rather than echo the slug, surface the values
 * that actually distinguish one photometric file from another — wattage,
 * colour temperature and beam angle — then keep the descriptive tail.
 */
export const iesVariantLabel = (filename: string): string => {
  const stem = filename
    .replace(/\.ies$/i, '')
    .replace(/^lumenx[_-]/i, '')
    .replace(/^ies-file-of[_-]/i, '');

  const watts = stem.match(/(\d{1,4})w\b/);
  const cct = stem.match(/(\d{4})k\b/);
  const beam = stem.match(/(\d{2,3})d\b/);

  const facts = [
    watts ? `${watts[1]}W` : '',
    cct ? `${cct[1]}K` : '',
    beam ? `${beam[1]}°` : '',
  ].filter(Boolean);

  const tail = stem
    .replace(/(\d{1,4})w\b/g, ' ')
    .replace(/(\d{4})k\b/g, ' ')
    .replace(/(\d{2,3})d\b/g, ' ')
    .replace(/\b(ufo|hbay|highbay|iesna\d*|ra\d+|lm|deg|cct|cri|rev\d)\b/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // A few supplier files are literal duplicates suffixed "- Copy"; the word
    // reads as noise beside its twin, so drop it.
    .replace(/\bcopy\b/gi, ' ')
    .split(' ')
    .filter((word) => word.length > 2)
    .slice(0, 4)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const label = [facts.join(' · '), tail].filter(Boolean).join(' — ');
  return label || stem.replace(/[-_]+/g, ' ');
};

/* ── IES files, grouped the way the catalogue is ──────────────────────────────
 * The downloads page used to render one flat grid of every photometric file.
 * The client's note on that: "it's just not organized. The guys are not going to
 * go through it like that… under category, have the category of the products
 * match that." So files are grouped under the same categories as the catalogue,
 * in the catalogue's own order.
 *
 * `IES_PRODUCT_MAP` is the only link from a file to a product, and it is
 * generated from the `ies_product_files` table — so a file never attached to a
 * product in the admin cannot be categorised. Those go into a trailing
 * "Unassigned" group rather than being hidden: its size is the signal that the
 * admin link still has to be filled in (`npm run ies:map` after attaching).
 */
export interface IesGroup<T> {
  id: string;
  title: string;
  files: T[];
  /** Distinct products the group's files belong to. */
  productCount: number;
  unassigned?: boolean;
}

/** filename -> the published product that owns it. */
const IES_OWNER: Map<string, Product> = (() => {
  const bySlug = new Map(PRODUCTS.map((product) => [product.slug, product]));
  const owner = new Map<string, Product>();
  for (const [slug, filenames] of Object.entries(IES_PRODUCT_MAP)) {
    const product = bySlug.get(slug);
    // A slug with no published product is a withdrawn range (GU10, Veris,
    // Arena…). Its files stay unassigned rather than pointing at a page that
    // no longer exists.
    if (!product) continue;
    for (const filename of filenames) if (!owner.has(filename)) owner.set(filename, product);
  }
  return owner;
})();

export function groupIesByCategory<T extends { filename: string }>(files: T[]): IesGroup<T>[] {
  const groups = new Map<string, IesGroup<T> & { slugs: Set<string> }>();
  const unassigned: T[] = [];

  for (const file of files) {
    const product = IES_OWNER.get(file.filename);
    if (!product) {
      unassigned.push(file);
      continue;
    }
    let group = groups.get(product.category);
    if (!group) {
      group = {
        id: product.category,
        title: getCategory(product.category)?.title ?? product.category,
        files: [],
        productCount: 0,
        slugs: new Set<string>(),
      };
      groups.set(product.category, group);
    }
    group.files.push(file);
    group.slugs.add(product.slug);
  }

  // Catalogue order, so this page reads in the same sequence as the grid.
  const ordered = PRODUCT_CATEGORIES
    .map((category) => groups.get(category.id))
    .filter((group): group is IesGroup<T> & { slugs: Set<string> } => Boolean(group))
    .map(({ slugs, ...group }) => ({ ...group, productCount: slugs.size }));

  if (unassigned.length > 0) {
    ordered.push({
      id: 'unassigned',
      title: 'Unassigned files',
      files: unassigned,
      productCount: 0,
      unassigned: true,
    });
  }

  return ordered;
}

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

/** Complete official LumenX datasheet library exposed by the site. */
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
    // Branded, so the datasheet library names the fitting the same way its
    // product page does.
    group.sheets.push({
      name: displayName(product),
      href: product.pdfUrl,
      category: product.category,
    });
  }
  return [...groups.values()]
    .filter((group) => group.sheets.length > 0)
    .map((group) => ({
      ...group,
      sheets: group.sheets.sort((a, b) => a.name.localeCompare(b.name)),
    }));
})();
