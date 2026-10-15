// The last step of the catalogue build.
//
//     python3 data-scrape/generate_catalogue.py
//     node scripts/apply-catalogue-overrides.mjs
//
// Why this exists
// ---------------
// `src/catalogue-scraped.ts` is generated and must never be hand-edited — the
// next regeneration discards anything typed into it. But the generator cannot
// express everything the published catalogue needs, and regenerating is not
// free: it rewrites every scraped image directory and every datasheet payload
// wholesale, which loses the normalisation passes in `scripts/` that run
// afterwards by hand.
//
// So the corrections live here instead. This script is the durable, reviewable
// home for:
//
//   · the published category order (W5) and the Indoor Architectural +
//     Decorative merge (Q15)
//   · product deletions (V200, GU10, Veris — Q9/Q16)
//   · the streetlight's move out of Floodlights (Q6)
//   · brand attribution for the OrbitX range (Q5/W6)
//   · spec corrections the scrape gets wrong (Soniq's wattage — Q4)
//
// It is idempotent: running it twice, or on an already-overridden file,
// produces the same result. It only ever *rewrites* the generated file — the
// source scrape under `data-scrape/products/` is never touched.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOGUE = path.join(ROOT, 'src', 'catalogue-scraped.ts');

/* ── The published category order (W5) ───────────────────────────────────────
 * The client wants the common products first: "your panels, your vapour
 * proofs, your tracks". Only those three were named on the call, so the rest of
 * this order is the inference documented in the change plan — confirm with the
 * client before treating it as final.
 *
 * Sensors stay last: `src/products.ts` pulls them out of the lighting list via
 * NON_LIGHTING_CATEGORY_IDS, so their position here only matters as a stable
 * fallback.
 */
const CATEGORY_ORDER = [
  'panels',
  'vapourproof',
  'track',
  'strips',
  'linears',
  'downlights',
  'highbays',
  'bulkheads',
  'floods',
  'architectural-indoor',
  'outdoor-architectural',
  'bollards',
  'street',
  'solar',
  'profiles',
  'sensors',
];

/* ── Deletions (Q9, Q16) ─────────────────────────────────────────────────────
 * The generator already drops GU10 and Veris via EXCLUDED_PRODUCTS. These
 * entries are the belt-and-braces backstop: if someone regenerates with the
 * generator's exclusion list edited, the products still do not publish.
 */
const DELETED_PRODUCTS = [
  { category: 'downlights', slug: 'gu10-downlight', reason: 'lamp-based fitting range, not an LED luminaire' },
  { category: 'panels', slug: 'veris', reason: 'discontinued (mis-spelled "varis" in the review notes)' },
];

/* ── Category moves ──────────────────────────────────────────────────────────
 * The 60W Street Light is curated in `official-products.ts`, so its category
 * lives there. This entry keeps any scraped record of the same name in step.
 */
const CATEGORY_MOVES = {
  'floods/60w-street-light': 'street',
};

/**
 * Every scraped record that still points at a dropped category, keyed by id.
 *
 * Product folders whose `product.json` names the old category slip past the
 * generator's folder-level override, so the retarget has to happen here as
 * well as in the generator.
 */
const RETARGET_CATEGORY_IDS = {
  'indoor-architectural': 'architectural-indoor',
  decorative: 'architectural-indoor',
};

/* ── Merged categories ───────────────────────────────────────────────────────
 * Indoor Architectural + Decorative are one published category (Q15).
 *
 * Two things can leave a stray second entry behind, and both need the same
 * treatment — retarget the products, then drop the duplicate:
 *   · the generator maps the 'Indoor Decorative' folder into 'Indoor
 *     Architectural' via FOLDER_CATEGORY_OVERRIDE, so only one id is emitted;
 *   · but a product.json whose `row.category` still says the old name emits a
 *     second category entry with the generator's placeholder copy.
 */
const MERGED_CATEGORY_IDS = { decorative: 'architectural-indoor' };

/** Category ids that must not survive the override. */
const DROPPED_CATEGORY_IDS = ['indoor-architectural', 'decorative'];

/* ── Deliberate name collisions ──────────────────────────────────────────────
 * `outdoor-architectural` publishes two products called "Eko" and two called
 * "Ele". This is NOT a scrape defect and nothing here should "fix" it:
 *
 *   eko     LEDsC4 Eko  — surface-mount projector
 *   eko-2   LEDsC4 Eko  — bollard
 *   ele     LEDsC4 Ele  — bollard, LO-400
 *   ele-2   LEDsC4 Ele  — bollard, LO-402
 *
 * Four separate supplier product pages, four separate fittings, two family
 * names. The 15 Oct review read the pairs as accidental duplicates; the images
 * were checked and the client then confirmed all four should be kept.
 *
 * `scripts/check-product-tiles.mjs` warns whenever one category carries the
 * same name twice, so the next occurrence gets a human look. There is no entry
 * for it here because there is nothing to change.
 */

/* ── Brand attribution (Q5 / W6) ─────────────────────────────────────────────
 * Every OrbitX fitting publishes as "OrbitX <name>" and sorts to the top of its
 * category. LumenX and OrbitX have a partnership, so the brand is shown.
 *
 * Authoritative list is `supplier == "OrbitX"` in data-scrape/master_products.json,
 * plus the Puck range, which the scrape mis-attributes to Rubicon even though
 * its spec PDFs are OrbitX's (OrbitX-Puck-Profile-70x36-specifications.pdf).
 * Trust the URL evidence, not the supplier column.
 */
const ORBITX_SLUGS = [
  'rhea', 'phoebe', 'flood', 'jupiter', 'retrofit',
  'puck-seamless', 'puck-profile-70x36', 'puck-profile-40x43', 'kepler',
  'puck-panel', 'cob', 'neptune', 'titan',
];

/* ── Spec corrections (Q4) ───────────────────────────────────────────────────
 * Soniq published two contradictory wattage rows — `Power = 3 W` (bogus) and
 * `Wattage = 3 selectable wattages` (correct). `catalogue-full.ts` maps
 * `wattage -> power` when deduping, which is why the pair slipped through: the
 * labels were treated as synonyms but the values were not, so both survived
 * into the card — and a card can only show one of them.
 *
 * Dropping the bogus row is the whole correction: the surviving `Wattage` row
 * already carries the right wording, and `src/product-tiles.ts` shortens it to
 * "3 selectable" for the tile while the specification table keeps the sentence.
 *
 * For the record, the real figures from the supplier URLs in
 * data-scrape/products/Linears/15-pioled-soniq/product.json:
 *   LL709  8ft  60W / 80W / 100W selectable
 *   LL705  4ft  30W / 40W / 50W selectable
 *   LL707  1ft  10W
 * They are deliberately not spliced in here: rewriting a generated value is a
 * scrape-level fix and belongs upstream, not in a downstream override.
 */
const SPEC_CORRECTIONS = {
  'linears/soniq': {
    drop: [(row) => row.label === 'Power' && /^3\s*w$/i.test(row.value.trim())],
  },
  // Products whose record carries a `Wattage` row and a `Power` row naming the
  // same fitting. The card has one wattage slot, so two rows means the card
  // publishes whichever the source happened to list first — a coin toss on the
  // number the customer reads.
  //
  // Two shapes, both resolved the same way:
  //   · the same range in another notation, e.g. `Power = "12–46 W"` beside
  //     `Wattage = "12W – 46W"`. One row survives, keeping the explanation.
  //   · a derived range against a real enumeration, e.g. Aegeon's
  //     `Power = "10–35 W"` beside `Wattage = "10W, 15W, 20W, 30W, 36W"`.
  //     These genuinely disagree at the top end (35 against 36), and the
  //     datasheet payloads carry the same pair, so the derived range is the row
  //     that goes.
  //
  // `redundantWattageRow` refuses to drop anything when the two rows make
  // different claims and neither is a placeholder, which is what keeps this
  // list safe to extend.
  ...Object.fromEntries(
    [
      'downlights/diffused-downlight',
      'downlights/legend',
      'downlights/surface-adjustable-downlight',
      'highbays/thermisto',
      'linears/thermisto',
      'vapourproof/saxa',
      'architectural-indoor/cloud-bell',
      'architectural-indoor/pearl',
      'architectural-indoor/dream-pen',
      'architectural-indoor/jiangnan',
      'architectural-indoor/crystal-cloud',
      'architectural-indoor/fabric-tape',
    ].map((key) => [key, { drop: [redundantWattageRow] }]),
  ),
};

/**
 * Two wattage values compared as *claims*, not as strings.
 *
 * `"12–46 W"`, `"12W – 46W"` and `"17W - 126W"` are the same claim written three
 * ways: strip the unit markers, the separators, any parenthetical aside and any
 * trailing qualifier, and what is left should be the bare figures.
 */
function normaliseWattageClaim(value) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')       // "(configuration-dependent)"
    .replace(/\bper metre\b/g, ' ')   // "20W/m – 40W/m" is a per-metre range
    .replace(/[^0-9.,–—-]+/g, ' ')    // drop "w", "lm", "available", units
    .replace(/\s+/g, '')
    .replace(/[–—-]+/g, '-')          // one dash to compare them all
    .replace(/\.$/, '');
}

/**
 * Drop one of a duplicated `Power` / `Wattage` pair.
 *
 * Pairs come in two shapes and both are handled the same way — publish one row,
 * never two:
 *
 *   · the values make the same claim in different notation
 *     (`Power = "15–500 W"` beside `Wattage = "15W – 500W (configuration-
 *     dependent)"`). Keep whichever carries the explanation.
 *   · one of them is a placeholder (`Power = "10–35 W"` beside
 *     `Wattage = "Contact our team for more details"`). Keep the real data.
 *
 * The wording of the surviving row is never rewritten: presentation is
 * `src/product-tiles.ts`'s job, and a scrape-level fix belongs upstream.
 *
 * When the two rows make *different* claims and neither is a placeholder,
 * neither is dropped — the build guard reports it instead, so a human decides
 * which figure is right.
 */
function redundantWattageRow(row, siblings) {
  if (row.label !== 'Power' && row.label !== 'Wattage') return false;
  const partnerLabel = row.label === 'Power' ? 'Wattage' : 'Power';
  const partner = siblings.find(
    (other) => other.label === partnerLabel && other.value.trim(),
  );
  if (!partner) return false;

  const mine = row.value.trim();
  const theirs = partner.value.trim();
  if (!mine) return true;

  // The placeholder row always loses, whichever side it is on.
  const placeholder = /contact (our team|us)|to be confirmed|^tbc$|^n\/?a$/i;
  if (placeholder.test(mine)) return true;
  if (placeholder.test(theirs)) return false;

  if (normaliseWattageClaim(mine) === normaliseWattageClaim(theirs)) {
    // Same claim: keep the more descriptive of the two, and break a tie by
    // preferring `Wattage`, which is the label the tile looks for anyway.
    if (theirs.length !== mine.length) return theirs.length > mine.length;
    return row.label === 'Power';
  }

  // Figures disagree.
  //
  // When `Wattage` is a real list of figures ("10W, 15W, 20W, 30W, 36W",
  // "18W, 36W, 54W") or a W-suffixed range ("17W - 126W"), the `Power` row is
  // the generator's derived summary of it, and the two disagree at the extremes
  // — Aegeon is `10–35 W` against 36W, Thermisto `17–100 W` against 126W. The
  // derived summary is the less specific of the two, so it is the one that
  // goes. The datasheet payloads carry the same contradictory pair, so this is
  // not a scrape artefact.
  //
  // A bare `Power = "12–46 W"` with no unit markers is not a derived summary,
  // so it is left alone — that shape is the same-claim case handled above.
  const isEnumeratedOrSuffixed = /,/.test(theirs) || /\d\s*w\b/i.test(theirs);
  if (row.label === 'Power' && isEnumeratedOrSuffixed) return true;

  // Never the other way round: a real enumeration is never dropped in favour of
  // a derived range.
  return false;
}

/* ── Parsing ────────────────────────────────────────────────────────────────
 * Deliberately textual, not a TypeScript parse: the only thing that must be
 * preserved is the generated bytes, so this reads the file as spans and edits
 * the spans it understands.
 */

const lineSpan = (text, index) => {
  const start = text.lastIndexOf('\n', index) + 1;
  const end = text.indexOf('\n', index);
  return { start, end: end === -1 ? text.length : end };
};

/** Every product object in the generated array, as byte spans. */
function parseProducts(text) {
  const products = [];
  const arrayAt = text.indexOf('export const SCRAPED_PRODUCTS');
  if (arrayAt === -1) throw new Error('SCRAPED_PRODUCTS array not found — is this the generated file?');

  const slugRe = /^ {4}slug: "((?:[^"\\]|\\.)*)",$/gm;
  slugRe.lastIndex = arrayAt;

  let match;
  const starts = [];
  while ((match = slugRe.exec(text)) !== null) {
    starts.push({ slug: JSON.parse(`"${match[1]}"`), index: match.index });
  }

  for (let i = 0; i < starts.length; i += 1) {
    const objStart = text.lastIndexOf('  {', starts[i].index);
    // The object runs to the next product's object start, or the array's close.
    const nextStart = i + 1 < starts.length ? text.lastIndexOf('  {', starts[i + 1].index) : -1;
    const objEnd = nextStart === -1 ? text.lastIndexOf('  },') + 4 : nextStart;

    const body = text.slice(objStart, objEnd);
    const category = body.match(/^ {4}category: "((?:[^"\\]|\\.)*)",$/m);

    products.push({
      slug: starts[i].slug,
      category: category ? JSON.parse(`"${category[1]}"`) : null,
      start: objStart,
      end: objEnd,
      body,
    });
  }
  return products;
}

/** Rewrite the `id:` of one category entry in SCRAPED_CATEGORIES. */
function replaceCategoryIds(text, idMap) {
  const arrayAt = text.indexOf('export const SCRAPED_CATEGORIES');
  const arrayEnd = text.indexOf('export const SCRAPED_PRODUCTS');
  if (arrayAt === -1 || arrayEnd === -1) throw new Error('SCRAPED_CATEGORIES array not found');

  const head = text.slice(0, arrayAt);
  const mid = text.slice(arrayAt, arrayEnd);
  const tail = text.slice(arrayEnd);

  const rewritten = mid.replace(/^( {4}id: ")((?:[^"\\]|\\.)*)(",$)/gm, (whole, a, id, c) => {
    const parsed = JSON.parse(`"${id}"`);
    const next = idMap[parsed];
    return next ? `${a}${next}${c}` : whole;
  });

  return head + rewritten + tail;
}

/**
 * Category copy for any id in CATEGORY_ORDER that the generator did not emit.
 *
 * Only `street` is in this position today: its one product is curated in
 * `src/official-products.ts`, so no scraped folder references it and the
 * generator has nothing to iterate over. The generator carries the same entry
 * in its CATEGORY_MAP, so if a source folder ever appears the two agree.
 */
const CATEGORY_FALLBACK = {
  street: {
    title: 'Street & Area Lighting',
    description:
      'Roadway and area luminaires with precision street optics and zero upward light for municipal roads, access routes and public spaces.',
    applications: 'Residential streets, urban roads, industrial access and public parks',
    linkLabel: 'Explore Street & Area Lighting',
  },
};

/** Build a category entry in the generated file's exact shape. */
function categoryEntry(id, meta) {
  const q = (value) => JSON.stringify(value);
  return [
    '  {',
    `    id: ${q(id)},`,
    `    title: ${q(meta.title)},`,
    `    description: ${q(meta.description)},`,
    `    applications: ${q(meta.applications)},`,
    `    imageUrl: ${q(`/product-images/categories/${id}.jpg`)},`,
    `    linkLabel: ${q(meta.linkLabel)},`,
    '  },',
  ].join('\n');
}

/**
 * Canonical copy for a merged category, applied to the entry the generator
 * emitted. The generator owns this text too (see CATEGORY_MAP in
 * data-scrape/generate_catalogue.py) — it is repeated here so that a catalogue
 * regenerated before that fix still publishes the merged copy rather than the
 * absorbed category's.
 */
const CATEGORY_COPY = {
  'architectural-indoor': {
    title: 'Architectural — Indoor & Decorative',
    description:
      'Recessed, surface and suspended architectural luminaires for refined interior detailing — circular systems, pendants, ceiling lights and statement decorative series.',
    applications: 'Offices, hospitality, retail, residential architecture and feature interiors',
    linkLabel: 'Explore Architectural — Indoor',
  },
};

/** Rewrite one `key: "value",` field of a category entry in place. */
function setCategoryField(entry, id, field, value) {
  const re = new RegExp(`^( {4}${field}: ")([^"]*)(",)$`, 'm');
  if (!re.test(entry)) {
    throw new Error(`category ${id}: no "${field}" field to set`);
  }
  return entry.replace(re, (_whole, lead, _old, tail) => `${lead}${value}${tail}`);
}

/**
 * Make the SCRAPED_CATEGORIES array exactly CATEGORY_ORDER: same ids, same
 * order, nothing extra.
 *
 * The generator iterates the filesystem, so its category order is a side effect
 * of folder names and its category set depends on which folders happen to
 * reference which category. Both are corrected here.
 */
function syncCategories(text, order, dropped, fallback) {
  const arrayAt = text.indexOf('export const SCRAPED_CATEGORIES');
  const arrayEnd = text.indexOf('export const SCRAPED_PRODUCTS');
  if (arrayAt === -1 || arrayEnd === -1) throw new Error('SCRAPED_CATEGORIES array not found');

  const head = text.slice(0, arrayAt);
  const mid = text.slice(arrayAt, arrayEnd);
  const tail = text.slice(arrayEnd);

  // Anchor on the declaration, not on the first '[' — the type annotation is
  // `ProductCategory[]`, so the first bracket in the slice belongs to the type
  // and slicing there drops it.
  const declaration = 'export const SCRAPED_CATEGORIES: ProductCategory[] = [';
  const openAt = mid.indexOf(declaration);
  if (openAt === -1) {
    throw new Error('could not find the SCRAPED_CATEGORIES declaration');
  }
  const prefix = mid.slice(0, openAt + declaration.length);
  const innerStart = openAt + declaration.length;
  const closeAt = mid.lastIndexOf('];');
  if (closeAt < innerStart) throw new Error('could not find the category array close');
  const inner = mid.slice(innerStart, closeAt);
  const suffix = mid.slice(closeAt);

  // Each entry is "  {\n ... \n  },\n".
  const existing = new Map();
  const entryRe = / {2}\{[\s\S]*?\n {2}\},/g;
  let m;
  while ((m = entryRe.exec(inner)) !== null) {
    const id = m[0].match(/^ {4}id: "((?:[^"\\]|\\.)*)",$/m);
    if (id) existing.set(JSON.parse(`"${id[1]}"`), m[0]);
  }
  if (existing.size === 0) throw new Error('no category entries parsed');

  const drop = new Set(dropped);
  const missing = [];
  const rewritten = [];
  const entries = order.map((id) => {
    const found = existing.get(id);
    if (found) {
      // A merge can leave the surviving entry carrying the *other* category's
      // copy and card image: the generator takes the first `product.json` it
      // reaches that names the id, and an Indoor Decorative folder still
      // saying `row.category = "Indoor Decorative"` wins the race. Normalise
      // the curated fields so the published category always describes itself.
      const copy = CATEGORY_COPY[id];
      if (!copy) return found;
      let entry = found;
      for (const [field, value] of Object.entries(copy)) {
        entry = setCategoryField(entry, id, field, value);
      }
      const card = `/product-images/categories/${id}.jpg`;
      entry = setCategoryField(entry, id, 'imageUrl', card);
      if (entry !== found) rewritten.push(id);
      return entry;
    }
    // A dropped id is never re-synthesised; anything else needs copy.
    if (drop.has(id)) return null;
    const meta = fallback[id];
    if (!meta) {
      missing.push(id);
      return null;
    }
    return categoryEntry(id, meta);
  });

  // Anything the generator emitted that CATEGORY_ORDER does not name is a
  // mistake in the data, not something to silently publish.
  const extras = [...existing.keys()].filter((id) => !order.includes(id) && !drop.has(id));

  return {
    text: head + prefix + '\n' + entries.filter(Boolean).join('\n') + '\n' + suffix + tail,
    missing,
    extras,
    rewritten,
  };
}

/* ── Run ──────────────────────────────────────────────────────────────────── */

if (!existsSync(CATALOGUE)) {
  console.error(`apply-catalogue-overrides: ${CATALOGUE} not found`);
  process.exit(1);
}

let text = readFileSync(CATALOGUE, 'utf8');
const report = [];
const before = text;

/* 1 · Merge the decorative category into architectural-indoor, in both the
 *     category array and every product that still points at it. */
text = replaceCategoryIds(text, MERGED_CATEGORY_IDS);

/* 2 · Retarget every product that still sits in a dropped category.
 *
 * This runs as its own pass, before anything is matched on `<category>/<slug>`.
 * Folding it into the main loop below made the result order-dependent: a
 * product's category was retargeted mid-iteration, but its correction key had
 * already been computed from the old id, so the correction silently did not
 * apply until the next run. */
let moved = 0;
{
  const retargetRe =
    /^( {4}category: ")([^"]*)(",)$/gm;
  text = text.replace(retargetRe, (whole, a, id, c) => {
    const target = RETARGET_CATEGORY_IDS[id];
    if (!target) return whole;
    moved += 1;
    return `${a}${target}${c}`;
  });
}

/* 3 · Products: deletions, explicit category moves, brand attribution, spec
 *     fixes. Walked in reverse so earlier spans stay valid as we splice. */
const products = parseProducts(text);
let deleted = 0;
let branded = 0;
let corrected = 0;

for (const product of [...products].reverse()) {
  const key = `${product.category}/${product.slug}`;

  // Deletions
  if (DELETED_PRODUCTS.some((d) => d.category === product.category && d.slug === product.slug)) {
    text = text.slice(0, product.start) + text.slice(product.end);
    deleted += 1;
    continue;
  }

  let body = product.body;
  let touched = false;

  // Explicit category move (a product the client asked to re-file).
  const target = CATEGORY_MOVES[key];
  if (target && product.category !== target) {
    body = body.replace(
      /^( {4}category: ")((?:[^"\\]|\\.)*)(",$)/m,
      `$1${target}$3`,
    );
    moved += 1;
    touched = true;
  }

  // Brand
  if (ORBITX_SLUGS.includes(product.slug) && !/^ {4}brand: /m.test(body)) {
    // Insert next to the other trailing optional fields, keeping the generated
    // ordering readable (… pdfUrl, warranty, brand).
    const warranty = body.match(/^ {4}warranty: .*$/m);
    if (warranty) {
      const at = warranty.index + warranty[0].length;
      body = `${body.slice(0, at)}\n    brand: "orbitx",${body.slice(at)}`;
    } else {
      const pdf = body.match(/^ {4}pdfUrl: .*$/m);
      if (pdf) {
        const at = pdf.index + pdf[0].length;
        body = `${body.slice(0, at)}\n    brand: "orbitx",${body.slice(at)}`;
      }
    }
    branded += 1;
    touched = true;
  }

  // Spec corrections
  const correction = SPEC_CORRECTIONS[key];
  if (correction) {
    // Spec rows are emitted as `{ label: "…", value: "…" },`. The generated
    // file has no escaped quotes inside a spec label or value, so a plain
    // quoted-string match is sufficient — and a generic escape-aware pattern
    // silently mis-parses it.
    const specRe = /^ {6}\{ label: "([^"]*)", value: "([^"]*)" \},$/gm;
    const rows = [];
    let sm;
    while ((sm = specRe.exec(body)) !== null) {
      rows.push({
        index: sm.index,
        length: sm[0].length,
        label: sm[1],
        value: sm[2],
        raw: sm[0],
      });
    }
    // Applied back-to-front so earlier offsets stay valid.
    for (const row of [...rows].reverse()) {
      if (correction.drop?.some((pred) => pred(row, rows))) {
        // Swallow the trailing newline with the row.
        body = body.slice(0, row.index) + body.slice(row.index + row.length + 1);
        corrected += 1;
      }
    }
    touched = true;
  }

  if (touched) {
    text = text.slice(0, product.start) + body + text.slice(product.end);
  }
}

/* 4 · Category order, membership and copy. */
const sync = syncCategories(text, CATEGORY_ORDER, DROPPED_CATEGORY_IDS, CATEGORY_FALLBACK);
text = sync.text;

if (sync.extras.length > 0) {
  console.warn(
    `apply-catalogue-overrides: the generator emitted ${sync.extras.length} category id(s) ` +
      `that CATEGORY_ORDER does not name, so they were dropped: ${sync.extras.join(', ')}. ` +
      'Add them to CATEGORY_ORDER (and CATEGORY_FALLBACK) if they should publish.',
  );
}
if (sync.missing.length > 0) {
  console.warn(
    `apply-catalogue-overrides: ${sync.missing.length} id(s) in CATEGORY_ORDER have no ` +
      `entry in the generated file and no CATEGORY_FALLBACK copy: ${sync.missing.join(', ')}`,
  );
}

if (text === before) {
  console.log('apply-catalogue-overrides: nothing to change (already applied)');
} else {
  writeFileSync(CATALOGUE, text);
  report.push(`products deleted: ${deleted}`);
  report.push(`products re-branded: ${branded}`);
  report.push(`products moved between categories: ${moved}`);
  report.push(`spec rows dropped: ${corrected}`);
  report.push(`categories: ${CATEGORY_ORDER.length} published in fixed order`);
  console.log(`apply-catalogue-overrides: rewrote src/catalogue-scraped.ts\n  ${report.join('\n  ')}`);
}
