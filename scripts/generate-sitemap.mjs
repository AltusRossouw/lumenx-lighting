// Regenerates public/sitemap.xml from the published catalogue. Runs as the npm
// "prebuild" step so newly added products are always included.
//
// The catalogue is the curated entries in src/official-products.ts plus every
// remaining scraped product that a curated entry has not claimed, so both files
// are parsed and the scraped keys taken by curated entries are removed.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(path.join(ROOT, 'src/official-products.ts'), 'utf8');
const SCRAPED_SRC = readFileSync(path.join(ROOT, 'src/catalogue-scraped.ts'), 'utf8');

const BASE = 'https://www.lumenx.co.za';

// Static pages always present on the site.
const STATIC_PATHS = [
  '/',
  '/the-solution',
  '/products',
  '/resources',
  '/design-tool',
  '/ies',
  '/planner',
  '/about',
  '/contact',
  '/privacy',
];

// Parse the official product allowlist:
//   createOfficialProduct({ slug: 'x', name: 'y', category: 'z', ... })
//   fromScraped('category', 'slug', 'name', 'sheet', { publicSlug?: 'alias' })
// A product entry starts with `createOfficialProduct({` or `fromScraped(` and
// ends when the next entry begins.
const products = [];
let current = null;
let pendingCreated = false;
for (const line of SRC.split('\n')) {
  if (/createOfficialProduct\(\{/.test(line)) {
    if (current && current.category && current.slug) products.push(current);
    current = null;
    pendingCreated = true;
    continue;
  }
  const fromScraped = line.match(/fromScraped\(\s*'([^']+)',\s*'([^']+)'/);
  if (fromScraped) {
    if (current && current.category && current.slug) products.push(current);
    current = { category: fromScraped[1], slug: fromScraped[2], scrapedSlug: fromScraped[2] };
    const sameLineSlug = line.match(/publicSlug:\s*'([^']+)'/);
    if (sameLineSlug) current.slug = sameLineSlug[1];
    continue;
  }
  if (pendingCreated) {
    const created = line.match(/slug:\s*'([^']+)'.*category:\s*'([^']+)'/);
    if (created) {
      current = { category: created[2], slug: created[1], scrapedSlug: null };
      pendingCreated = false;
      continue;
    }
  }
  if (!current) continue;
  const publicSlug = line.match(/publicSlug:\s*'([^']+)'/);
  if (publicSlug) current.slug = publicSlug[1];
}
if (current && current.category && current.slug) products.push(current);

// Everything else in the scrape is published too. Skip the keys a curated entry
// already claimed, or those products would appear twice.
// Key on the SCRAPED slug, not the public one: two products publish under an
// alias (lean-153, cob-dr), so using the public slug left their scraped records
// unclaimed and the sitemap listed them twice.
const consumed = new Set(
  products.filter((p) => p.scrapedSlug).map((p) => `${p.category}/${p.scrapedSlug}`),
);
const scr = SCRAPED_SRC.split('\n');
let sCurrent = null;
for (const line of scr) {
  const block = line.match(/^\s{4}slug: "([^"]+)",\s*$/);
  if (block) {
    if (sCurrent && sCurrent.category) products.push(sCurrent);
    sCurrent = { slug: block[1], category: null };
    continue;
  }
  const cat = line.match(/^\s{4}category: "([^"]+)",\s*$/);
  if (cat && sCurrent && !sCurrent.category) {
    sCurrent.category = cat[1];
    // names containing a quote are escaped in the source; irrelevant here
    if (!consumed.has(`${sCurrent.category}/${sCurrent.slug}`)) products.push(sCurrent);
    sCurrent = null;
  }
}

// Update this when the published range changes. It guards the parser against
// silently emitting a short sitemap after a source reshuffle.
const EXPECTED_PRODUCT_COUNT = 118;

if (products.length !== EXPECTED_PRODUCT_COUNT) {
  console.error(
    `sitemap: expected ${EXPECTED_PRODUCT_COUNT} published products, parsed ${products.length}`,
  );
  process.exit(1);
}
for (const p of products) {
  if (!p.category || !p.slug) {
    console.error('sitemap: product missing category or slug', p);
    process.exit(1);
  }
}

const categories = [...new Set(products.map((p) => p.category))].sort();

const urls = new Set([
  ...STATIC_PATHS,
  ...categories.map((c) => `/products/${c}`),
  ...products.map((p) => `/products/${p.category}/${p.slug}`),
]);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .sort()
  .map((loc) => `  <url><loc>${BASE}${loc}</loc></url>`)
  .join('\n')}
</urlset>
`;

const out = path.join(ROOT, 'public', 'sitemap.xml');
writeFileSync(out, xml);
console.log(`sitemap: wrote ${urls.size} URLs (${products.length} products, ${categories.length} categories)`);
