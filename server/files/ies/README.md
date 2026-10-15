# IES Walled Garden

This directory holds the raw photometric (`.ies`) files. It sits **outside** the
public web root (`public/`) and is **never** served as a static asset.

- Files are only streamed through `GET /api/ies/:filename`, which requires a
  signed-in account (sign-up is self-serve, no admin approval). Client decision
  Q10: the downloads stay gated.
- The allowlist is the brand prefix — `lumenx-*.ies` or `orbitx-*.ies`
  (`isIesFilename` in `server/services/ies.js`). The `[MANUFAC]` keyword is used
  for display only, because the supplier's own files carry `PioLED` or nothing.

## Adding files

Use the admin UI — **/admin → IES files** — rather than dropping files in by
hand. Pick a product, upload one or more `.ies` files, and the server:

1. renames each file to the repository convention (lowercase, `lumenx-` prefix,
   non-alphanumerics collapsed to `-`), e.g.
   `PioLED_3000K 10W Sauron Downlight.IES` → `lumenx-3000k-10w-sauron-downlight.ies`;
2. writes it here; and
3. records the product association in the `ies_product_files` table.

Associations are the source of truth for which file a product page offers. The
committed map `src/ies-product-map.ts` is a build artefact generated from that
table:

```
npm run ies:map          # rewrite src/ies-product-map.ts from the database
npm run ies:map:check    # fail if the committed map is out of date
```

Do not hand-edit `src/ies-product-map.ts`. To bootstrap a database from the
previously committed map (or from a supplier-tree export), use
`npm run ies:map:import`.

`npm run ies:seed` writes fabricated placeholder files for local route testing
only — see the warning in `server/scripts/seed-ies.js` before running it.
