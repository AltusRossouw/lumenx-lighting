#!/usr/bin/env node
// Build a datasheet payload for any curated product that does not have one.
//
// The curated entries in src/official-products.ts carry a finished Keynote sheet
// but no payload, so they cannot render through the generated route that every
// other product uses. This reads their definition and writes the equivalent
// payload, so the whole catalogue can share one pipeline.
//
// Existing payloads are never overwritten.
//
//   node scripts/build-missing-payloads.mjs [--check] [--force] [slug ...]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'server', 'datasheets-data');
const SRC = readFileSync(path.join(ROOT, 'src', 'official-products.ts'), 'utf8');
const CATS = readFileSync(path.join(ROOT, 'src', 'catalogue-scraped.ts'), 'utf8');

const check = process.argv.includes('--check');
const force = process.argv.includes('--force');
const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));

/** category id -> display title, as the sheet prints it. */
const CATEGORY_TITLES = Object.fromEntries(
  [...CATS.matchAll(/^    id: "([a-z0-9-]+)",\n    title: "([^"]+)"/gm)].map((m) => [m[1], m[2]]),
);

/** Pull the object literal out of each curated entry and evaluate it. */
function curatedProducts() {
  const out = [];
  for (const m of SRC.matchAll(/createOfficialProduct\(\{([\s\S]*?)\n  \}\),/g)) {
    try {
      // eslint-disable-next-line no-new-func
      out.push(new Function(`return ({${m[1]}});`)());
    } catch (err) {
      console.error(`  could not parse a createOfficialProduct entry: ${err.message}`);
    }
  }
  for (const m of SRC.matchAll(
    /fromScraped\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'([\s\S]*?)\),\n/g)) {
    const [, category, slug, name, sheet, rest] = m;
    const pub = /publicSlug: '([^']+)'/.exec(rest);
    out.push({
      slug: pub ? pub[1] : slug,
      category,
      name,
      sheet,
      _scraped: { category, slug },
    });
  }
  return out;
}

/** Which bucket a spec belongs in. Mirrors the layout the payloads already use. */
const PHYSICAL = /^(housing|colour|color|material|mounting|type|dimensions|weight|finish|body|construction|trim|reflector|diffuser|lens|connector|cable)/i;
const COMPLIANCE = /^(ip rating|ip|ip-rating|certifications?|warranty|guarantee|lifetime|lifespan|operating temp|ambient|compliance|standard|approvals?|ik)/i;
const ELECTRICAL = /^(power|wattage|input voltage|voltage|power factor|surge|dimmable|dimming|driver|frequency|current|electrical)/i;

function build(entry) {
  const specs = (entry.specs || []).filter((s) => s && s.label && s.value);
  const cut = path.join(ROOT, 'public', 'product-images', 'cutouts', entry.category, `${entry.slug}.png`);
  const hero = existsSync(cut)
    ? `../public/product-images/cutouts/${entry.category}/${entry.slug}.png`
    : null;

  const physical = specs.filter((s) => PHYSICAL.test(s.label));
  const compliance = specs.filter((s) => COMPLIANCE.test(s.label));
  const electrical = specs.filter((s) => ELECTRICAL.test(s.label));
  const used = new Set([...physical, ...compliance, ...electrical]);
  const other = specs.filter((s) => !used.has(s));

  const left = [];
  if (physical.length) left.push({ title: 'Physical', rows: physical });
  if (compliance.length) left.push({ title: 'Compliance', rows: compliance });
  const right = [];
  if (other.length) right.push({ title: 'Technical Data', rows: other });
  if (electrical.length) right.push({ title: 'Electrical', rows: electrical });

  return {
    fileStem: entry.name,
    meta: { rev: '1.0' },
    name: String(entry.name || '').toUpperCase(),
    category: (CATEGORY_TITLES[entry.category] || entry.category || '').toUpperCase(),
    variant: entry.summary || '',
    stats: specs.slice(0, 3).map((s) => {
      const m = /^([\d.,\s\u2013-]+)\s*([a-zA-Z%°]+)?$/.exec(String(s.value).trim());
      return m
        ? { label: s.label, value: m[1].trim(), unit: m[2] || '' }
        : { label: s.label, value: String(s.value), unit: '' };
    }),
    heroImage: { src: hero || `/product-images/${entry.slug}.png`, alt: entry.name },
    overview: [entry.description || entry.summary || ''],
    features: entry.features || [],
    applications: entry.applications || [],
    columns: { left, right },
  };
}

const existing = new Set(readdirSync(DATA).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
let written = 0, skipped = 0;

for (const entry of curatedProducts()) {
  if (!entry.slug) continue;
  if (named.length && !named.includes(entry.slug)) continue;
  // a fromScraped entry already has a payload under its scraped slug
  const stems = [entry.slug];
  if (entry._scraped) stems.push(entry._scraped.slug);
  if (!force && stems.some((s) => existing.has(s))) { skipped += 1; continue; }
  if (!(entry.specs || []).length) { skipped += 1; continue; }

  const payload = build(entry);
  const dest = path.join(DATA, `${entry.slug}.json`);
  if (check) {
    console.log(`  would write ${entry.slug}.json  (${(entry.specs || []).length} specs)`);
    written += 1;
    continue;
  }
  writeFileSync(dest, `${JSON.stringify(payload, null, 2)}\n`);
  written += 1;
}

console.log(`  ${check ? 'would write' : 'wrote'} ${written} payload(s), skipped ${skipped}`);
