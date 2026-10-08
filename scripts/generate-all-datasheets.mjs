#!/usr/bin/env node
// Render a LumenX A4 spec sheet for every product that has a datasheet payload.
//
//   node scripts/generate-all-datasheets.mjs            # all products
//   node scripts/generate-all-datasheets.mjs --new      # only ones with no PDF yet
//   node scripts/generate-all-datasheets.mjs slug ...   # specific payload slugs
//
// For each product it reads server/datasheets-data/<slug>.json, takes the hero from
// that payload, and renders public/catalogues/lumenx/lumenx-datasheet-<slug>.pdf via
// scripts/generate-keynote-datasheet.mjs using the generated replacement map in
// scripts/examples/generated/<slug>.json (see scripts/build-datasheet-replacements.py).
//
// Requires macOS + Keynote, and Keynote must already be running.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'server', 'datasheets-data');
const REPS = path.join(ROOT, 'scripts', 'examples', 'generated');
const OUTDIR = path.join(ROOT, 'public', 'catalogues', 'lumenx');
const TEMPLATE = 'public/catalogues/lumenx/lumenx-datasheet-saxa-triproof.key';

const args = process.argv.slice(2);
const onlyNew = args.includes('--new');
const named = args.filter((a) => !a.startsWith('--'));

/** Resolve a payload's heroImage.src (written as ../public/...) to a real file. */
function heroFor(slug) {
  const p = path.join(DATA, `${slug}.json`);
  if (!fs.existsSync(p)) return null;
  const src = (JSON.parse(fs.readFileSync(p, 'utf8')).heroImage || {}).src || '';
  if (!src) return null;
  const rel = src.replace(/^\.\.\//, '');
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? rel : null;
}

const slugs = fs.readdirSync(DATA).filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5))
  .filter((s) => (named.length ? named.includes(s) : true))
  .filter((s) => fs.existsSync(path.join(REPS, `${s}.json`)))
  .filter((s) => !onlyNew || !fs.existsSync(path.join(OUTDIR, `lumenx-datasheet-${s}.pdf`)));

console.log(`${slugs.length} product(s) to render\n`);

let ok = 0, skipped = 0, failed = [];

for (const [i, slug] of slugs.entries()) {
  const hero = heroFor(slug);
  const out = `public/catalogues/lumenx/lumenx-datasheet-${slug}.pdf`;
  const label = `[${String(i + 1).padStart(3)}/${slugs.length}] ${slug}`;

  if (!hero) {
    // no usable hero image: the sheet would render with an empty image frame
    console.log(`${label}  SKIP — no hero image`);
    skipped += 1;
    continue;
  }

  const started = Date.now();
  const r = spawnSync('node', [
    'scripts/generate-keynote-datasheet.mjs',
    '--template', TEMPLATE,
    '--output', out,
    '--hero', hero,
    '--replacements', `scripts/examples/generated/${slug}.json`,
    '--key-output', `/tmp/lx/keys/${slug}.key`,
  ], { cwd: ROOT, encoding: 'utf8' });

  if (r.status !== 0) {
    const why = (r.stderr || r.stdout || '').trim().split('\n').filter(Boolean).pop() || 'unknown';
    console.log(`${label}  FAIL — ${why.slice(0, 110)}`);
    failed.push(slug);
    continue;
  }
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`${label}  ok  ${secs}s`);
  ok += 1;
}

console.log(`\nrendered ${ok}  skipped ${skipped}  failed ${failed.length}`);
if (failed.length) {
  console.log('failed:', failed.join(', '));
  fs.writeFileSync(path.join(ROOT, 'scripts', 'examples', 'generated', '_failed.txt'), failed.join('\n'));
}
