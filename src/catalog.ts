// Runtime catalogue store.
//
// The base catalogue is compiled into the bundle (catalogue-scraped.ts and
// catalogue-full.ts). The admin can add categories/products or override base
// entries; those rows are stored in PostgreSQL and fetched from /api/catalog.
// This module merges the two sources and exposes a React store, following the
// same useSyncExternalStore pattern as src/content.ts.
//
// Fail-safe rule: if the API or database is unavailable, the static catalogue
// remains exactly as it is today. New admin-only URLs simply 404 until the API
// is reachable.

import { useSyncExternalStore } from 'react';
import type { Product, ProductCategory, ProductImage } from './types';
import { SCRAPED_CATEGORIES } from './catalogue-scraped';
import { ALL_PRODUCTS } from './catalogue-full';
import { IES_PRODUCT_MAP } from './ies-product-map';
import {
  PLACEHOLDER_PRODUCT_IMAGE,
  displayName,
  sortProducts,
  type DatasheetCategoryGroup,
  type DatasheetEntry,
  type IesGroup,
} from './products';
import { api } from './lib/api';

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Catalog {
  categories: ProductCategory[];
  products: Product[];
  productsByCategory: Record<string, Product[]>;
  categoriesById: Map<string, ProductCategory>;
  productsByKey: Map<string, Product>;
  iesMap: Record<string, string[]>;
  status: CatalogStatus;
  getCategory(id: string): ProductCategory | undefined;
  getProduct(category: string, slug: string): Product | undefined;
  getAnyProduct(category: string, slug: string): Product | undefined;
  getProductsByCategory(id: string): Product[];
  getIesFiles(slug: string): string[];
  getDatasheetLibrary(): { name: string; href: string }[];
  getDatasheetGroups(): DatasheetCategoryGroup[];
  groupIesByCategory<T extends { filename: string }>(files: T[]): IesGroup<T>[];
}

const keyOf = (category: string, slug: string) => category + '/' + slug;

const staticCategories: ProductCategory[] = SCRAPED_CATEGORIES.map((category, index) => ({
  ...category,
  range: category.id === 'sensors' ? 'sensors' : 'lighting',
  sortOrder: index,
}));

const staticProducts: Product[] = ALL_PRODUCTS;

const staticCategoryOrder = new Map(staticCategories.map((category, index) => [category.id, index]));
const staticCategoryIds = new Set(staticCategories.map((category) => category.id));
const staticProductKeys = new Set(staticProducts.map((product) => keyOf(product.category, product.slug)));

const normalizeCategory = (category: ProductCategory): ProductCategory => ({
  id: category.id,
  title: category.title || category.id,
  description: category.description || '',
  applications: category.applications || '',
  imageUrl: category.imageUrl || '',
  linkLabel: category.linkLabel || 'View Range',
  range: category.range === 'sensors' ? 'sensors' : 'lighting',
  sortOrder: Number.isFinite(Number(category.sortOrder)) ? Number(category.sortOrder) : 0,
  ...(category.source ? { source: category.source } : {}),
});

const normalizeProduct = (product: Product): Product => {
  const images = (product.images ?? []).filter(
    (image): image is ProductImage => Boolean(image && image.src),
  );
  const mainImage =
    (product.mainImage && images.some((image) => image.src === product.mainImage)
      ? product.mainImage
      : undefined) || images[0]?.src;
  return {
    ...product,
    slug: product.slug,
    category: product.category,
    name: product.name,
    summary: product.summary || '',
    description: product.description || '',
    specs: Array.isArray(product.specs) ? product.specs : [],
    features: Array.isArray(product.features) ? product.features : [],
    applications: Array.isArray(product.applications) ? product.applications : [],
    images,
    mainImage,
    imageUrl: mainImage || PLACEHOLDER_PRODUCT_IMAGE,
    published: product.published !== false,
    pdfSource:
      product.pdfSource === 'generated'
        ? 'generated'
        : product.pdfSource === 'uploaded' || product.pdfUrl
          ? 'uploaded'
          : 'none',
  };
};

const mergeCategories = (stored: ProductCategory[]): ProductCategory[] => {
  const byId = new Map<string, ProductCategory>(
    staticCategories.map((category) => [category.id, normalizeCategory(category)]),
  );
  for (const category of stored) {
    if (!category?.id) continue;
    const previous = byId.get(category.id);
    byId.set(category.id, normalizeCategory({ ...(previous ?? category), ...category }));
  }
  return [...byId.values()].sort((a, b) => {
    const aStatic = staticCategoryOrder.get(a.id);
    const bStatic = staticCategoryOrder.get(b.id);
    if (aStatic !== undefined && bStatic !== undefined) return aStatic - bStatic;
    if (aStatic !== undefined) return -1;
    if (bStatic !== undefined) return 1;
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return order !== 0 ? order : a.title.localeCompare(b.title);
  });
};

const mergeProducts = (stored: Product[]): Product[] => {
  const byKey = new Map<string, Product>(
    staticProducts.map((product) => [keyOf(product.category, product.slug), normalizeProduct(product)]),
  );
  for (const product of stored) {
    if (!product?.category || !product?.slug) continue;
    const key = keyOf(product.category, product.slug);
    const previous = byKey.get(key);
    byKey.set(key, normalizeProduct({ ...(previous ?? product), ...product }));
  }
  return [...byKey.values()];
};

const datasheetLibrary = (products: Product[]): { name: string; href: string }[] => {
  const seen = new Set<string>();
  const sheets: { name: string; href: string }[] = [];
  for (const product of products) {
    if (!product.pdfUrl || seen.has(product.pdfUrl)) continue;
    seen.add(product.pdfUrl);
    sheets.push({ name: displayName(product), href: product.pdfUrl });
  }
  return sheets.sort((a, b) => a.name.localeCompare(b.name));
};

const datasheetGroups = (
  products: Product[],
  categories: ProductCategory[],
): DatasheetCategoryGroup[] => {
  const seen = new Set<string>();
  const groups = new Map<string, DatasheetCategoryGroup>();
  for (const category of categories) {
    groups.set(category.id, { categoryId: category.id, title: category.title, sheets: [] });
  }
  for (const product of products) {
    if (!product.pdfUrl || seen.has(product.pdfUrl)) continue;
    seen.add(product.pdfUrl);
    const group = groups.get(product.category);
    if (!group) continue;
    const entry: DatasheetEntry = {
      name: displayName(product),
      href: product.pdfUrl,
      category: product.category,
    };
    group.sheets.push(entry);
  }
  return [...groups.values()]
    .filter((group) => group.sheets.length > 0)
    .map((group) => ({
      ...group,
      sheets: [...group.sheets].sort((a, b) => a.name.localeCompare(b.name)),
    }));
};

export function groupIesByCategory<T extends { filename: string }>(
  files: T[],
  catalog: Pick<Catalog, 'products' | 'categories' | 'iesMap'>,
): IesGroup<T>[] {
  const productBySlug = new Map(catalog.products.map((product) => [product.slug, product]));
  const ownerByFilename = new Map<string, Product>();
  for (const [slug, filenames] of Object.entries(catalog.iesMap)) {
    const product = productBySlug.get(slug);
    if (!product) continue;
    for (const filename of filenames) {
      if (!ownerByFilename.has(filename)) ownerByFilename.set(filename, product);
    }
  }

  const groups = new Map<string, IesGroup<T> & { slugs: Set<string> }>();
  const unassigned: T[] = [];
  for (const file of files) {
    const product = ownerByFilename.get(file.filename);
    if (!product) {
      unassigned.push(file);
      continue;
    }
    // Photometry belonging to a hidden product is not listed publicly. It is
    // neither grouped nor dumped into the unassigned bucket.
    if (product.published === false) continue;
    let group = groups.get(product.category);
    if (!group) {
      group = {
        id: product.category,
        title: catalog.categories.find((category) => category.id === product.category)?.title ?? product.category,
        files: [],
        productCount: 0,
        slugs: new Set<string>(),
      };
      groups.set(product.category, group);
    }
    group.files.push(file);
    group.slugs.add(product.slug);
  }

  const ordered = catalog.categories
    .map((category) => groups.get(category.id))
    .filter((group): group is IesGroup<T> & { slugs: Set<string> } => Boolean(group))
    .map(({ slugs, ...group }) => ({ ...group, productCount: slugs.size }));

  if (unassigned.length > 0) {
    ordered.push({ id: 'unassigned', title: 'Unassigned files', files: unassigned, productCount: 0, unassigned: true });
  }
  return ordered;
}

const buildCatalog = (
  storedCategories: ProductCategory[],
  storedProducts: Product[],
  iesMap: Record<string, string[]>,
  status: CatalogStatus,
): Catalog => {
  const categories = mergeCategories(storedCategories);
  const products = mergeProducts(storedProducts);
  const productsByCategory: Record<string, Product[]> = {};
  for (const product of products) {
    (productsByCategory[product.category] ||= []).push(product);
  }
  for (const category of Object.keys(productsByCategory)) {
    productsByCategory[category] = sortProducts(productsByCategory[category]);
  }
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const productsByKey = new Map(products.map((product) => [keyOf(product.category, product.slug), product]));
  const visibleProducts = products.filter((product) => product.published !== false);

  return {
    categories,
    products,
    productsByCategory,
    categoriesById,
    productsByKey,
    iesMap,
    status,
    getCategory: (id) => categoriesById.get(id),
    getProduct: (category, slug) => {
      const product = productsByKey.get(keyOf(category, slug));
      return product && product.published !== false ? product : undefined;
    },
    getAnyProduct: (category, slug) => productsByKey.get(keyOf(category, slug)),
    getProductsByCategory: (id) =>
      (productsByCategory[id] ?? []).filter((product) => product.published !== false),
    getIesFiles: (slug) => iesMap[slug] ?? [],
    getDatasheetLibrary: () => datasheetLibrary(visibleProducts),
    getDatasheetGroups: () => datasheetGroups(visibleProducts, categories),
    groupIesByCategory: (files) => groupIesByCategory(files, { products, categories, iesMap }),
  };
};

let storedCategories: ProductCategory[] = [];
let storedProducts: Product[] = [];
let storedIesMap: Record<string, string[]> = {};
let current = buildCatalog(storedCategories, storedProducts, IES_PRODUCT_MAP, 'idle');
let inFlight: Promise<void> | null = null;

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => current;
const notify = () => listeners.forEach((cb) => cb());

const setCurrent = (next: Catalog) => {
  current = next;
  notify();
};

const resolveIesMap = (): Record<string, string[]> =>
  Object.keys(storedIesMap).length > 0 ? storedIesMap : IES_PRODUCT_MAP;

export const loadCatalog = (options: { force?: boolean } = {}): Promise<void> => {
  if (inFlight) return inFlight;
  if (current.status === 'ready' && !options.force) return Promise.resolve();

  if (current.status !== 'ready') {
    setCurrent(buildCatalog(storedCategories, storedProducts, resolveIesMap(), 'loading'));
  }

  inFlight = (async () => {
    try {
      const [catalogResult, iesResult] = await Promise.allSettled([
        api.catalog(),
        api.iesProductMap(),
      ]);

      if (catalogResult.status === 'fulfilled') {
        storedCategories = Array.isArray(catalogResult.value.categories)
          ? catalogResult.value.categories
          : [];
        storedProducts = Array.isArray(catalogResult.value.products)
          ? catalogResult.value.products
          : [];
      }
      if (iesResult.status === 'fulfilled' && iesResult.value?.map) {
        storedIesMap = iesResult.value.map;
      }

      const ok = catalogResult.status === 'fulfilled';
      setCurrent(buildCatalog(storedCategories, storedProducts, resolveIesMap(), ok ? 'ready' : 'error'));
    } catch {
      setCurrent(buildCatalog(storedCategories, storedProducts, resolveIesMap(), 'error'));
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

export const refreshCatalog = (): Promise<void> => {
  return loadCatalog({ force: true });
};

export const useCatalog = (): Catalog => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const getCatalogSnapshot = (): Catalog => current;

export const getCategory = (id: string): ProductCategory | undefined => current.getCategory(id);
export const getProduct = (category: string, slug: string): Product | undefined =>
  current.getProduct(category, slug);
export const getAnyProduct = (category: string, slug: string): Product | undefined =>
  current.getAnyProduct(category, slug);
export const getProductsByCategory = (id: string): Product[] => current.getProductsByCategory(id);
export const getIesFilesForProduct = (slug: string): string[] => current.getIesFiles(slug);

export const isStaticProduct = (category: string, slug: string): boolean =>
  staticProductKeys.has(keyOf(category, slug));
export const isStaticCategory = (id: string): boolean => staticCategoryIds.has(id);

export const slugify = (value: string): string =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
