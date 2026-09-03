# LumenX — Master Datasheet Template

One **HTML + CSS datasheet** that mirrors the layout of the reference
`LumenX_Datasheet_35W Track Spot.pdf`, so every product's PDF looks identical.

```
datasheet-template/
├── index.html               ← the template (A4, self-contained, data-driven)
├── preview/
│   └── Track_Spot_datasheet.pdf   ← sample output generated from this template
└── README.md
```

Open `index.html` in Chrome — the page hydrates from the embedded JSON block
(`<script id="datasheet-data">`) and renders the full datasheet on screen.
`Cmd/Ctrl + P → Save as PDF` reproduces the reference sheet almost exactly.

## What the template reproduces (measured from the reference PDF)

A4 portrait, white body, **full-bleed dark top/bottom bands** (`#201820` from
the reference) carrying the white wordmark, cyan accent hairlines, and this
exact reading order:

1. **Top band** — LumenX logo left · `PRODUCT DATA SHEET · REV 1.0` right
2. **Hero** — faint letterspaced category watermark → product name →
   optional variant line → three stat chips (POWER / LUMENS / IP RATING)
   · product image right
3. **Left column** — OVERVIEW → APPLICATIONS → PHYSICAL → COMPLIANCE
4. **Right column** — PRODUCT INFORMATION → ELECTRICAL
5. **Bottom zone** — DIMENSION DRAWING (left) · legal notes (right)
6. **Bottom band** — contact details · logo

Brand colours, fonts and spacing live in the `:root { … }` block and the
section CSS — restyle once, re-render everything.

## The data model

Every product is one JSON object. Fields map onto the existing catalogue:

| Template field              | Source in `src/products.ts`                     | Datasheet-only? |
| --------------------------- | ----------------------------------------------- | --------------- |
| `name`                      | `product.name`                                  |                 |
| `category` (watermark)      | `category` / marketing name (e.g. “TRACK SPOTS”)| often yes      |
| `variant`                   | `summary`                                       | optional       |
| `stats[]` (hero chips)      | first specs (Wattage, Lumens, IP)               | derive         |
| `heroImage.src`             | `product.imageUrl` → `public/product-images/*`  |                 |
| `overview[]`                | `description` (paragraph copy)                  |                 |
| `features[]`                | `features`                                      |                 |
| `applications[]`            | `applications`                                  |                 |
| `columns.left/right[].rows` | `specs` regrouped into Physical / Compliance / Product Information / Electrical | regroup |
| `drawing`                   | per-product dimension line-art (png/svg)        | **yes**        |
| `notes[]`                   | fixed legal boilerplate (same for every sheet)  |                 |
| `contact`                   | fixed (site constants)                          |                 |

Note: today's `specs` are flat `{label, value}` lists, while the reference
datasheet groups them under four headings (Product Information / Physical /
Electrical / Compliance). Grouping can be inferred by label, or the template
consumers can pass grouped sections explicitly (as the sample JSON does).

## Recommended pipeline — and why HTML→PDF is the right instinct

Your idea (design once in HTML/CSS, convert at download time) is the correct
approach — the only real decision is **where the HTML→PDF conversion runs**.

| Option | How | Good | Bad |
| --- | --- | --- | --- |
| **A. Server-side render (recommended)** | Keep this template + per-product JSON; an Express route renders it in **headless Chromium** when the user hits *Download PDF*; cache the result | Real `.pdf` download with a plain `<a href>`, pixel-identical to what you design, vector text, full CSS incl. paged media; template doubles as an on-screen preview — **implemented below** | Adds Chromium to the server (~200–300 MB image size, extra Docker deps) |
| **B. Client-side print (zero infra)** | Open a print-styled route and call `window.print()` | No server work | Browser dialog — user must “Save as PDF” themselves; can't force a clean `.pdf` download; font/DPI varies by machine |
| **C. @react-pdf/renderer** | Rebuild layout in react-pdf JSX (flex + absolute) | Pure-JS PDF, no browser; small deploy | Its styling model is a subset of CSS — you maintain a *second* layout, not your HTML/CSS |
| D. html2canvas + jsPDF (client) | Rasterise DOM to canvas → PDF | — | Text becomes an image (unsearchable, large files) — **avoid** |

**Better way than static files:** today each of the 18 PDFs is hand-made in
Keynote and drifts (they already differ slightly — different watermark
categories, extra “features” lines, etc.). Because the products already exist
as data in `src/products.ts`, generate the datasheet **from that data**:

```
Download PDF click
   → GET /api/download/datasheet/:slug.pdf
   → (cache miss) build JSON from product record
   → render datasheet-template/index.html with that JSON in headless Chrome
   → stream PDF, cache by slug + content hash
   → (cache hit) stream cached PDF
```

Single source of truth = identical layout + current specs, always. The existing
static PDFs remain as a fallback until every product is migrated.

### Already wired up in this repo (pilot product: 35W Track Spot)

```
datasheet-template/index.html              ← shared A4 template (data-driven)
server/datasheets-data/<slug>.json         ← per-product payload (Track Spot first)
server/services/datasheet-pdf.js           ← renderer: template + JSON → cached A4 PDF
server/routes/downloads.js                 ← GET /api/download/datasheet/generated/:slug
src/products.ts                            ← pdfUrl points at the generated endpoint
server/cache/datasheets/                   ← render cache (gitignored)
```

The renderer drives **headless Chromium** directly (no npm dependency — it
resolves `CHROME_PATH` or the system Chrome/Chromium; if `puppeteer-core` is
ever installed it is used instead). Flow: *Download PDF click →
`/api/download/datasheet/generated/:slug` → cache miss renders the template
with that product's JSON → streams the PDF → cached by slug + content mtime*.
The existing static `/api/download/datasheet/:filename` route is untouched, so
non-migrated products keep working.

**Add a product in three steps:**
1. Copy `server/datasheets-data/track-spot-35w.json` → `<slug>.json`, fill in
   values (mapping table above). `fileStem` controls the downloaded filename.
2. Point the product's `pdfUrl` in `src/products.ts` at
   `/api/download/datasheet/generated/<slug>`.
3. Regenerate; the cache rebuilds automatically whenever the JSON or template
   mtime changes.

### Docker note

The runtime `Dockerfile` stage now ships everything the renderer needs on
`node:20-alpine`:

- `chromium` + `font-carlito` (metric-compatible with Calibri) + `ttf-freefont`
  (Arial/Helvetica fallback) with an `fc-cache` run, and `CHROME_PATH` preset;
- the template itself (`COPY datasheet-template ./datasheet-template`) and the
  brand/product art it references (`public/logo-wide.png`,
  `public/product-images/`) — the renderer loads these via absolute `file://`
  URLs from the container's `/app/public`.

Everything else stays the same; the existing static datasheets, API and `dist`
are copied as before.

## Generating the sample PDF yourself (local, no dependencies)

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
  --user-data-dir=/tmp/ds-chrome \
  --virtual-time-budget=3000 \
  --print-to-pdf="$(pwd)/datasheet-template/preview/Track_Spot_datasheet.pdf" \
  "file://$(pwd)/datasheet-template/index.html"
```

Keep `print-color-adjust: exact` (already in the CSS) so the dark bands print.

## Checklist when adding a new product

1. Copy the JSON block in `index.html`, fill in the product (see mapping table).
2. Hero chips: pick 3 stats (`POWER`, `LUMENS`, `IP RATING`) — value + optional
   unit — as in the reference sheets.
3. Regroup `specs` into the four table groups; leave a group empty to hide it.
4. Export a clean dimension line-art image (PNG/SVG) → `drawing.src`. Products
   without a drawing simply leave `drawing.src` empty — the whole
   **Dimension Drawing** section disappears (legal notes then span the width).
5. Render → confirm single A4 page (template is fixed-height; content flows to
   page 2 automatically if a product genuinely needs more room).
