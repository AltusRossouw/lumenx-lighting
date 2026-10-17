#!/usr/bin/env node
// Render src/ies-product-map.ts from the `ies_product_files` table.
//
// The map the product pages import is a BUILD ARTEFACT. The source of truth is
// PostgreSQL: the admin "IES files" tab (/admin → IES files) attaches a file to
// a product, and this script turns those rows into the committed TS module.
//
//     npm run ies:map            # rewrite src/ies-product-map.ts
//     npm run ies:map -- --check # fail if the committed file is out of date
//
// Options:
//     --out <path>   write somewhere other than src/ies-product-map.ts
//     --check        compare instead of writing; exit 1 when they differ
//     --quiet        only print warnings and errors
//
// Refuses to write an empty map: an empty or unseeded database must never
// silently strip every product page of its photometry. Bootstrap the table from
// the previously committed map first (see server/scripts/import-ies-product-map.js).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../server/config.js';
import { getPool } from '../server/db.js';
import { buildProductMap, describeError } from '../server/services/ies-product-map.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUT = path.join(REPO_ROOT, 'src', 'ies-product-map.ts');

const parseArgs = (argv) => {
  const options = { out: DEFAULT_OUT, check: false, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--quiet') options.quiet = true;
    else if (arg === '--out') options.out = path.resolve(argv[++i] ?? '');
    else if (arg.startsWith('--out=')) options.out = path.resolve(arg.slice('--out='.length));
    else {
      console.error(`[ies:map] unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return options;
};

const HEADER = [
  '// Product -> IES photometry map.',
  '//',
  '// GENERATED — do not edit by hand.',
  '//',
  '// Source of truth: the `ies_product_files` table in PostgreSQL, written by the',
  '// admin "IES files" tab (/admin -> IES files) or by attaching a file with',
  '// POST /api/admin/ies/upload. Regenerate after any change with:',
  '//',
  '//     npm run ies:map',
  '//',
  '// Only files that exist in server/files/ies/ or uploads/ies/ are listed, so a',
  '// product page can never offer a download that 404s. Each key is a product',
  '// slug; each value is that product\'s photometry. Products absent from this',
  '// map have no IES file yet, so their product page shows "Contact us for the',
  '// IES file" instead.',
  '',
];

/** Byte-for-byte the shape the original Python builder emitted. */
const render = (map) => {
  const lines = [...HEADER];
  lines.push('export const IES_PRODUCT_MAP: Record<string, string[]> = {');
  for (const slug of Object.keys(map).sort()) {
    lines.push(`  '${slug}': [`);
    for (const filename of map[slug]) lines.push(`    '${filename}',`);
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');
  lines.push('/** IES filenames for a product slug (empty when it has none). */');
  lines.push('export const iesFilesForProduct = (slug: string): string[] =>');
  lines.push('  IES_PRODUCT_MAP[slug] ?? [];');
  lines.push('');
  return lines.join('\n');
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const { map, files, missing, ambiguous } = await buildProductMap();
  const slugs = Object.keys(map);

  for (const entry of ambiguous) {
    console.warn(
      `[ies:map] warning: slug '${entry.slug}' is used by ${entry.categories.join(' and ')} — ` +
        'iesFilesForProduct(slug) cannot tell them apart, so both pages share this photometry.',
    );
  }
  if (missing.length > 0) {
    const shown = missing.slice(0, 5).map((row) => row.filename).join(', ');
    console.warn(
      `[ies:map] warning: ${missing.length} attachment(s) point at files that are not in ${config.iesDir} ` +
        `and were skipped — ${shown}${missing.length > 5 ? `, … ${missing.length - 5} more` : ''}`,
    );
    console.warn('[ies:map] warning: if that is unexpected, check IES_DIR against the database.');
  }

  if (files === 0) {
    throw new Error(
      'the generated map would be empty. Seed ies_product_files first ' +
        '(server/scripts/import-ies-product-map.js) or check DATABASE_URL.',
    );
  }

  const output = render(map);
  let previous = null;
  try {
    previous = await fs.readFile(options.out, 'utf8');
  } catch {
    previous = null;
  }

  if (options.check) {
    if (previous === output) {
      console.log(`[ies:map] up to date — ${slugs.length} products, ${files} files.`);
      return;
    }
    throw new Error(`${path.relative(REPO_ROOT, options.out)} is out of date — run: npm run ies:map`);
  }

  if (previous === output) {
    console.log(`[ies:map] unchanged — ${slugs.length} products, ${files} files.`);
    return;
  }

  await fs.mkdir(path.dirname(options.out), { recursive: true });
  await fs.writeFile(options.out, output, 'utf8');
  console.log(
    `[ies:map] wrote ${path.relative(REPO_ROOT, options.out)} — ${slugs.length} products, ${files} files.`,
  );
};

main()
  .catch((err) => {
    console.error('[ies:map] failed:', describeError(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPool().end();
  });
