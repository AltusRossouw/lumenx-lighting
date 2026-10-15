// Fails the build when the catalogue would render a contradictory or
// ambiguous product card.
//
// Why this exists: the four specification tiles on a product card are resolved
// by label matching (`src/product-tiles.ts`), because the scraped spec labels
// are inconsistent — `Wattage` and `Power`, `IP Rating` and `ip-rating`,
// `Lumens` and `Lumen Output`. The cost of that loose matching is that two rows
// can claim the same slot without anyone noticing.
//
// That is not hypothetical. Soniq shipped with both
//
//     { label: 'Power',   value: '3 W' }                    <- bogus
//     { label: 'Wattage', value: '3 selectable wattages' }  <- correct
//
// and `catalogue-full.ts` maps `wattage -> power` when deduping, which is
// exactly why the pair slipped through review. The tile could only show one of
// them, so the card published a wattage the fitting does not have.
//
// Runs as part of `npm run prebuild`, immediately before the sitemap.
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

let failures = 0;
let checked = 0;

try {
  const { ALL_PRODUCTS } = await server.ssrLoadModule('/src/catalogue-full.ts');
  const { resolveProductTiles, duplicateTileKeys, TILE_PLACEHOLDER } =
    await server.ssrLoadModule('/src/product-tiles.ts');

  const problems = [];

  for (const product of ALL_PRODUCTS) {
    checked += 1;
    const where = `${product.category}/${product.slug}`;

    // 1 · Contradictory spec rows for one slot.
    for (const dupe of duplicateTileKeys(product)) {
      if (!dupe.collision) continue;
      problems.push(
        `${where}: ${dupe.labels.length} spec rows resolve to the "${dupe.key}" tile ` +
          `(${dupe.labels.join(', ')}) — the card can only show one`,
      );
    }

    // 2 · The card must always render exactly four slots.
    const tiles = resolveProductTiles(product);
    if (tiles.length !== 4) {
      problems.push(`${where}: resolved ${tiles.length} tiles, expected 4`);
      continue;
    }
    if (new Set(tiles.map((tile) => tile.label)).size !== 4) {
      problems.push(
        `${where}: duplicate tile labels (${tiles.map((t) => t.label).join(', ')})`,
      );
    }

    // 3 · The light-output guarantee must never be published as *the*
    //     guarantee — the client read it as the fitting's guarantee and it
    //     understates the operational one. It stays in the spec table.
    const guarantee = tiles.find((tile) => tile.key === 'guarantee');
    if (guarantee && /light[\s-]?output/i.test(guarantee.value)) {
      problems.push(
        `${where}: guarantee tile shows the light-output guarantee ` +
          `("${guarantee.value}") — the operational guarantee must win`,
      );
    }

    // 4 · An empty slot must read as the deliberate placeholder.
    for (const tile of tiles) {
      if (!tile.value.trim()) {
        problems.push(`${where}: "${tile.key}" tile resolved to an empty value`);
      }
    }
  }

  if (problems.length > 0) {
    failures = problems.length;
    console.error(`product tiles: ${failures} problem(s) in ${checked} products\n`);
    for (const problem of problems) console.error(`  · ${problem}`);
    console.error(
      '\nFix the source data under data-scrape/products/<Category>/<folder>/, or add an\n' +
        'explicit correction to scripts/apply-catalogue-overrides.mjs. Never hand-edit\n' +
        'src/catalogue-scraped.ts — the next regeneration discards it.',
    );
  } else {
    console.log(
      `product tiles: ${checked} products, four slots each, no contradictory labels ` +
        `(placeholder: "${TILE_PLACEHOLDER}")`,
    );
  }

  // Two products sharing a name inside one category.
  //
  // A warning, not a failure. The 15 Oct review flagged "Eko" and "Ele" as
  // apparent scrape duplicates, and they were investigated and confirmed NOT to
  // be duplicates: LEDsC4 genuinely publishes two different fixtures under each
  // name — Eko is a surface-mount projector (eko) *and* a bollard (eko-2), Ele
  // is two bollard variants — and the client's decision was to keep all four.
  //
  // The warning stays because it will fire again the next time a supplier reuses
  // a family name, which is exactly when a human should look. Treat it as "check
  // this is another settled both-and", not as "delete one".
  const namesByCategory = new Map();
  for (const product of ALL_PRODUCTS) {
    const key = `${product.category}\u0000${product.name}`;
    const list = namesByCategory.get(key) ?? [];
    list.push(product.slug);
    namesByCategory.set(key, list);
  }
  const collisions = [...namesByCategory.entries()].filter(([, slugs]) => slugs.length > 1);
  if (collisions.length > 0) {
    console.warn(
      `\nproduct tiles: ${collisions.length} name(s) shared by more than one product in a ` +
        'category. Check each is a deliberate both-and (see the Eko/Ele note above) ' +
        'rather than a scrape duplicate:',
    );
    for (const [key, slugs] of collisions) {
      const [category, name] = key.split('\u0000');
      console.warn(`  · ${category}: "${name}" is published as ${slugs.join(' and ')}`);
    }
  }
} finally {
  await server.close();
}

if (failures > 0) process.exit(1);
