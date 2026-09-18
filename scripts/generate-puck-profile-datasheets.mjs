#!/usr/bin/env node
// Regenerate the two Puck Profile datasheets (40x43 and 70x36) end to end.
//
//   open -a Keynote && node scripts/generate-puck-profile-datasheets.mjs
//
// Two steps, because the Keynote generator cannot do the second one:
//
//   1. Render the sheet from the LINEAR template with a per-product replacement map
//      (scripts/examples/new-products/puck-profile-<size>.json). Passing --dimension
//      makes the generator suppress the template's own drawing, leaving that area blank.
//   2. Stamp the correct profile drawing (scripts/examples/new-products/
//      dim-puck-profile-<size>.png) into that area with pypdf.
//
// The linear template carries its dimension drawing as Keynote vector shapes, so the
// generator can neither replace nor preserve it — hence step 2. Step 2 needs pypdf;
// point PYTHON at an interpreter that has it (e.g. a venv). Without it the sheets are
// still generated, but their DIMENSION DRAWING area stays blank.
//
// Requires macOS + Keynote, and Keynote must already be running or osascript fails
// with error -600.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PYTHON = process.env.PYTHON || 'python3';
const TEMPLATE = 'public/catalogues/lumenx/lumenx-datasheet-linear-50x83mm.key';

// Drawing position on the A4 page, measured from the shipped 50x83mm sheet
// (top-left origin, points).
const RECT = { x: 18, yTop: 694, w: 341, h: 91 };

const SIZES = ['40x43', '70x36'];

const STAMP_PY = [
  'import io, sys',
  'from PIL import Image',
  'from pypdf import PdfReader, PdfWriter, Transformation',
  'pdf, png = sys.argv[1], sys.argv[2]',
  'x, y_top, w, h = (float(v) for v in sys.argv[3:7])',
  'S = 8',
  'reader = PdfReader(pdf); page = reader.pages[0]',
  'page_h = float(page.mediabox.height)',
  'im = Image.open(png).convert("RGB").resize((int(w) * S, int(h) * S), Image.LANCZOS)',
  'buf = io.BytesIO(); im.save(buf, format="PDF", resolution=72 * S); buf.seek(0)',
  'page.merge_transformed_page(PdfReader(buf).pages[0], Transformation().translate(x, page_h - y_top - h))',
  'writer = PdfWriter(); writer.add_page(page)',
  'open(pdf, "wb").write(b"") or None',
  'with open(pdf, "wb") as fh: writer.write(fh)',
].join('\n');

let failures = 0;

for (const slug of SIZES) {
  const out = 'public/catalogues/lumenx/lumenx-datasheet-puck-profile-' + slug + '.pdf';
  const r = spawnSync('node', [
    'scripts/generate-keynote-datasheet.mjs',
    '--template', TEMPLATE,
    '--output', out,
    '--hero', 'public/product-images/orbitx-puck-' + slug + '.png',
    '--dimension', 'scripts/examples/new-products/dim-puck-profile-' + slug + '.png',
    '--replacements', 'scripts/examples/new-products/puck-profile-' + slug + '.json',
    '--key-output', '/tmp/puck-profile-' + slug + '.key',
  ], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('keynote generation failed for ' + slug);
    process.exit(r.status ?? 1);
  }

  const py = spawnSync(PYTHON, ['-c', STAMP_PY, out,
    'scripts/examples/new-products/dim-puck-profile-' + slug + '.png',
    String(RECT.x), String(RECT.yTop), String(RECT.w), String(RECT.h),
  ], { cwd: ROOT, encoding: 'utf8' });

  if (py.status !== 0) {
    failures += 1;
    const why = (py.stderr || '').trim().split('\n').pop() || 'pypdf unavailable';
    console.error('  stamp failed for ' + slug + ' — ' + why);
    console.error('  sheet generated, but its DIMENSION DRAWING area is blank.');
    continue;
  }
  if (!fs.existsSync(path.join(ROOT, out))) {
    console.error('  output missing for ' + slug);
    process.exit(1);
  }
  console.log('  ok  ' + slug);
}

console.log(failures ? 'finished with ' + failures + ' stamping failure(s).' : 'done.');
