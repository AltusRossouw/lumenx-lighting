# LumenX catalogue rollout — progress tracker

Objective: implement `resources/LumenxProductList.csv` master list site-wide with
scraped product data + the generated A4 datasheet pipeline.

Source of truth for mapping/diff: `resources/products-inventory.json`
(`master[]` rows carry siteStatus / siteSlug / hasDatasheet) and
`resources/catalogue-audit.md`.

## Status (round 7 — code complete, deploying)

- Master rows: **116** — live catalogue now matches: 6 new categories + 59 added products,
  the 10 non-CSV products removed (with their old PDFs), all Spec Sheet buttons point
  at the generated datasheet endpoint, Resources hub lists 111 generated datasheets.
- **Datasheet payloads: 111 render-verified files → cover 112 of 116 master rows.**
  - 56 existing site products · 7 PioLED outdoor/solar · 2 Superlume solar
  - 24 LEDsC4 (proxy) · 5 KingLong decorative (proxy) · 2 Superlume wall lights
  - **15 Steinel sensors** (proxy; old CSV URLs were dead — mapped to current
    Steinel product pages; remote/micro model mapping approximate)
- Rendered PDF cache: `server/cache/datasheets/<slug>.pdf` (gitignored).

## Remaining data work

1. **Superlume Fabric Tape + Palm & Coco (2)** — CSV gives only a category
   listing URL, not product pages.
2. **LBY profiles (1)** — CSV points at shop root (`lbyafrica.com/shop/`).
3. **Sunfor solar (1)** — local Price-List PDF (on the user's Cloud), needs the
   file or manual entry.
4. Enrich thin payloads (sparse LEDsC4 JS pages; Steinel Smart/Service remote
   accessories; Legend/GU10/Pakman site rows).

## Pending build/wiring (needs user sign-off)

1. Product images + dimension drawings (awaiting go-ahead).
2. Wire product pages (`pdfUrl` → generated endpoint), remove the 10 non-CSV
   products (awaiting confirm), add new categories/sections to products.ts /
   nav / routes, regenerate Resources library.
3. Final: lint + build + Portainer deploy + health verify.

## Open decisions (awaiting user)

- [ ] Confirm removal of the 10 legacy products (or map any to CSV rows)
- [ ] Quality sign-off on pilot PDF layout/data split
- [ ] OK to scrape supplier images into `public/product-images/`
- [ ] LEDsC4 family-wide spec ranges (e.g. Circular 33–575W) acceptable, or
      capture per-configuration values?
