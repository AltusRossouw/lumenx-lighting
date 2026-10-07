import { Product } from './types';
import { SCRAPED_PRODUCTS } from './catalogue-scraped';
import { CONSUMED_SCRAPED_PRODUCTS, OFFICIAL_PRODUCTS } from './official-products';

/**
 * The rest of the catalogue.
 *
 * `official-products.ts` holds the curated entries — the ones with a finished
 * LumenX datasheet, hand-written copy and a chosen hero. Everything else in the
 * scrape is published here so the full range is visible while the remaining
 * datasheets are built.
 *
 * These products therefore have **no datasheet**, which the type allows and the
 * product page already guards for. Add one by moving the product into
 * `official-products.ts` with a `sheet:` argument.
 */

/** Tile rendered onto the shared gradient by `scripts/make-product-tiles.py`. */
export const productTile = (category: string, slug: string): string =>
  `/product-images/tiles/${category}/${slug}.jpg`;

/**
 * Put a product on its tile.
 *
 * Every product — curated or scraped — is fronted by the tile rendered from its
 * own photograph, so the whole grid reads the same way no matter what the
 * supplier shot looked like. The originals stay in the gallery behind it.
 */
const withTile = (product: Product): Product => {
  const tile = productTile(product.category, product.slug);
  const rest = (product.images ?? []).filter((image) => image.src !== product.imageUrl);
  return {
    ...product,
    imageUrl: tile,
    images: [{ src: tile, fit: 'contain' as const, alt: product.name }, ...rest],
  };
};

export const CATALOGUE_PRODUCTS: Product[] = SCRAPED_PRODUCTS
  .filter((product) => !CONSUMED_SCRAPED_PRODUCTS.has(`${product.category}/${product.slug}`))
  .map(withTile);

/** The whole published catalogue: curated entries first, then the rest. */
export const ALL_PRODUCTS: Product[] = [...OFFICIAL_PRODUCTS.map(withTile), ...CATALOGUE_PRODUCTS];
