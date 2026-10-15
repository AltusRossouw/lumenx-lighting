// One-time import of the product → IES associations into PostgreSQL.
//
// `src/ies-product-map.ts` used to be the source of truth, hand-maintained (and
// before that, built from the supplier folder tree by
// scripts/build-ies-product-map.py). The table `ies_product_files` is now the
// source of truth and the TS file is generated from it, so this script moves an
// existing map into the database once:
//
//     npm run ies:map:import                          # from src/ies-product-map.ts
//     node server/scripts/import-ies-product-map.js db/seeds/ies-product-map.json
//
// Safe to re-run in the sense that an existing association is never
// overwritten (rows are inserted with ON CONFLICT (filename) DO NOTHING). But
// run it ONCE per database: re-running after the client has edited the library
// through /admin would re-create associations they deliberately detached, since
// a detach deletes the row and there is then nothing left to conflict with.
//
// The JSON form is what scripts/build-ies-product-map.py emits when the
// client's supplier folder tree (docs/fromKaylen/, gitignored) is available.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { getPool, query } from '../db.js';
import { describeError, listIesDirFilenames, slugify } from '../services/ies-product-map.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_SOURCE = path.join(REPO_ROOT, 'src', 'ies-product-map.ts');

// Photometry that must NOT be carried over into the database.
//
// W4a deletes the V200 UFO Highbay product; both `samuraiv200` files were
// listed under the Samurai key (the supplier filed them in the Samurai folder)
// and were meant to be removed from src/ies-product-map.ts by hand. Doing it
// here keeps the deletion with the data that produces the map.
const EXCLUDED_FILES = new Set([
  'lumenx-samuraiv200-160w-200lm-5700k-80ra-90d-iesna2002.ies',
  'lumenx-samuraiv200-160w-200lm-5700k-80ra-90d-iesna2002-2.ies',
]);

/** Parse `'slug': [ 'file', … ],` blocks out of src/ies-product-map.ts. */
const parseTypescriptMap = (text) => {
  const map = {};
  const keyRe = /^\s*'([^']+)':\s*\[/gm;
  let match;
  while ((match = keyRe.exec(text)) !== null) {
    const slug = match[1];
    const rest = text.slice(keyRe.lastIndex);
    const end = rest.indexOf(']');
    if (end === -1) throw new Error(`unterminated list for '${slug}'`);
    const files = [...rest.slice(0, end).matchAll(/'([^']+\.ies)'/gi)].map((m) => m[1]);
    map[slug] = files;
    keyRe.lastIndex += end;
  }
  return map;
};

const loadSource = async (sourcePath) => {
  const text = await fs.readFile(sourcePath, 'utf8');
  if (sourcePath.endsWith('.json')) {
    const parsed = JSON.parse(text);
    const source = parsed.map ?? parsed;
    const map = {};
    for (const [slug, files] of Object.entries(source)) {
      map[slugify(slug)] = (Array.isArray(files) ? files : []).map(String);
    }
    return map;
  }
  return parseTypescriptMap(text);
};

const main = async () => {
  const sourcePath = path.resolve(process.argv[2] ?? DEFAULT_SOURCE);
  const map = await loadSource(sourcePath);
  const present = new Set(await listIesDirFilenames());

  let inserted = 0;
  let skipped = 0;
  let excluded = 0;
  let absent = 0;

  for (const [slug, files] of Object.entries(map)) {
    for (const filename of files) {
      if (EXCLUDED_FILES.has(filename)) {
        excluded += 1;
        // Remove a row an earlier run may have created before the exclusion.
        await query('DELETE FROM ies_product_files WHERE filename = $1', [filename]);
        continue;
      }
      if (!present.has(filename)) absent += 1;

      const result = await query(
        `INSERT INTO ies_product_files (product_slug, filename, source, uploaded_by)
         VALUES ($1, $2, 'import', 'ies:map:import')
         ON CONFLICT (filename) DO NOTHING`,
        [slug, filename],
      );
      if (result.rowCount > 0) inserted += 1;
      else skipped += 1;
    }
  }

  const kept = inserted + skipped;
  console.log(`[ies:map:import] source: ${path.relative(REPO_ROOT, sourcePath)}`);
  console.log(`[ies:map:import] products: ${Object.keys(map).length}`);
  console.log(`[ies:map:import] associations inserted: ${inserted}, already present: ${skipped}`);
  if (excluded) console.log(`[ies:map:import] excluded (V200 UFO Highbay removed in W4a): ${excluded}`);
  if (absent) {
    console.log(`[ies:map:import] ${absent} of ${kept} files are not in ${config.iesDir} — they will be skipped by npm run ies:map.`);
  }
  console.log('[ies:map:import] next: npm run ies:map   (rebuild src/ies-product-map.ts from the database)');
  console.log('[ies:map:import] note: this is a one-time bootstrap — do not re-run once the client has edited the library in /admin.');
};

main()
  .catch((err) => {
    console.error('[ies:map:import] failed:', describeError(err));
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPool().end();
  });
