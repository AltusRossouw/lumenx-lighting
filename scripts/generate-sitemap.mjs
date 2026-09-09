// Regenerates public/sitemap.xml from the official product allowlist in
// src/official-products.ts. Runs automatically as the npm "prebuild" step so
// newly added products are always included in the sitemap.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = readFileSync(path.join(ROOT, 'src/official-products.ts'), 'utf8');

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
    current = { category: fromScraped[1], slug: fromScraped[2] };
    const sameLineSlug = line.match(/publicSlug:\s*'([^']+)'/);
    if (sameLineSlug) current.slug = sameLineSlug[1];
    continue;
  }
  if (pendingCreated) {
    const created = line.match(/slug:\s*'([^']+)'.*category:\s*'([^']+)'/);
    if (created) {
      current = { category: created[2], slug: created[1] };
      pendingCreated = false;
      continue;
    }
  }
  if (!current) continue;
  const publicSlug = line.match(/publicSlug:\s*'([^']+)'/);
  if (publicSlug) current.slug = publicSlug[1];
}
if (current && current.category && current.slug) products.push(current);

if (products.length !== 24) {
  console.error(`sitemap: expected 24 official products, parsed ${products.length}`);
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
