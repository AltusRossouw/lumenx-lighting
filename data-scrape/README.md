# LumenX product data scrape

Built from the product list (`product-lists/*.csv`, exported from the Numbers workbook;
identical master copy kept at `../resources/LumenxProductList.csv`).

## Layout

- `product-lists/` — per-category CSVs (the source rows, one link per product)
- `master_products.json` — parsed master list (116 rows; 108 with an http(s) link)
- `products/` — **one folder per product**:
  - `README.md` — uniform markdown (quick facts → description → specifications → images → references)
  - `product.json` — raw scraped data
  - `images/` — high-resolution product photos downloaded from the supplier site
  - `datasheet-*.pdf` — spec-sheet PDF when the supplier page linked one
- `products/00-INDEX.md` — clickable catalogue index with hero images + dimensions
- `tools/` — scraper (`run.mjs`, extractors per platform in `tools/lib/`, `chrome.mjs` for
  the bot-protected sites ledsc4.com and steinel.de)

Rows without a web link (9) have no folder: OrbitX Retrofit / Jupiter / Puck Panel / COB strip,
Mez Dark Light, LEDVANCE Performance, Spazio 3/4 Wire, Sunfor (local PDF), Profiles??? (LBY shop section).

## Re-run

```bash
cd tools && npm i          # cheerio + puppeteer-core (once)
node run.mjs               # skips folders that already exist
node rerun.mjs <url-text>  # force a single product
node run.mjs --steinel-pdfs  # (re)download Steinel datasheets via Chrome session
```

## Build the site catalogue

The site's product data (`src/catalogue-scraped.ts`) is generated from these
folders. It copies the product photos into `public/scraped/<category>/<slug>/`,
copies datasheet PDFs into `public/datasheets/<slug>.pdf`, and rewrites the
`Product[]`/`ProductCategory[]` arrays the LumenX site consumes.

Run from the repo root, then rebuild the frontend:

```bash
python3 data-scrape/generate_catalogue.py
npm run lint && npm run build
```
