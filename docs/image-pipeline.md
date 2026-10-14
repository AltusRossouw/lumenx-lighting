# Image pipeline and catalogue review

Everything about how the product images are produced, reviewed and shipped, plus
the setup needed to run it on a fresh machine.

The catalogue is **117 published products across 16 categories**, backed by
**495 source images** and rendered to **119 tiles** (two slugs are aliases of the
same fitting).

---

## 1. The pipeline in one picture

```
supplier images                 cut-outs               tiles              site
─────────────────               ────────               ─────              ────
public/scraped/<cat>/<slug>/    public/                public/            Vite
public/product-images/*.png  →  product-images/    →   product-images/  →  serves
                                cutouts/<cat>/         tiles/<cat>/          public/
                                <slug>.png             <slug>.jpg            directly

             make-cutouts.py              make-product-tiles.py
             (rembg / BiRefNet)           (card_art.compose_cutout)
```

The tile is a 1600×900 JPEG: the cut-out composited over a dark teal gradient,
scaled so the product fills a fixed fraction of the frame. **Every product card
on the site shows a tile**, so a fault in a cut-out shows up as a fault on the
card.

---

## 2. Setting up on a fresh machine

macOS only, because the tooling leans on Apple Chrome and Homebrew paths.

### 2.1 Required software

```bash
# Homebrew, if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node poppler

# Chrome is used headlessly for screenshots and for fetching supplier images
# (several supplier CDNs answer curl with 403 but serve a browser normally).
# Install from https://www.google.com/chrome/ if not already present.
```

Versions this was built and tested against:

| Tool | Version |
|---|---|
| Node | v24.17.0 |
| npm | 11.19.0 |
| Python (system, for the scripts) | 3.14.7 at `/opt/homebrew/bin/python3` |
| rembg | 2.0.85 |
| onnxruntime | 1.30.0 |
| Chrome | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| poppler (`pdftoppm`, `pdftotext`) | `/opt/homebrew/bin/` |

### 2.2 The repository

```bash
git clone https://github.com/AltusRossouw/lumenx-lighting.git
cd lumenx-lighting
git checkout staging          # staging is ahead of main; work happens here
npm install
```

### 2.3 The rembg virtualenv

Deliberately outside the repo, because it is **653 MB** and must never be
committed.

```bash
python3 -m venv ~/.lumenx/rembg-venv
~/.lumenx/rembg-venv/bin/pip install --upgrade pip
~/.lumenx/rembg-venv/bin/pip install "rembg[cpu,cli]"
```

### 2.4 The segmentation models

Downloaded on first use into `~/.rembg/models/`. `birefnet-general` is **928 MB**,
so do this on a good connection before starting work.

```bash
~/.lumenx/rembg-venv/bin/python -c "
from rembg import new_session
for m in ('birefnet-general', 'birefnet-general-lite'):
    print('fetching', m); new_session(m)
print('done')
"
```

| Model | Size | Role |
|---|---|---|
| `birefnet-general` | 928 MB | **the default used for every cut-out** |
| `birefnet-general-lite` | 214 MB | fallback if you want speed over quality |
| `bria-rmbg` | 977 MB | downloaded, **not yet benchmarked** |
| `isnet-general-use`, `u2netp`, `silueta` | small | historical; superseded |

> **Speed.** `birefnet-general` runs on CPU through onnxruntime and takes about
> **9 seconds per image** — a full regeneration of 119 cut-outs is roughly
> **7 hours**. `onnxruntime` reports `CoreMLExecutionProvider` as available but
> rembg does not request it. Wiring that up is the single biggest available
> speed-up and has not been attempted.

---

## 3. Day-to-day: the local dev loop

**This is the fast path. Do not push to staging to look at an image.**

```bash
npm run dev          # http://localhost:3000
```

- **No database is needed.** The products page imports its catalogue statically
  from `src/`, so the whole site renders with no Postgres and no Express server.
- **Vite serves `public/` live.** Re-render a tile and it appears on the next page
  refresh — **no build, no deploy, no restart.** A round trip is about 5 seconds
  against roughly 12 minutes for a Portainer redeploy.

### 3.1 Taking a screenshot

Vite's HMR websocket means the page never goes idle, so Chrome's
`--virtual-time-budget` **hangs forever** waiting for a settle that never comes.

```bash
scripts/shoot.sh http://localhost:3000/products/bulkheads /tmp/bulkheads.png 2400
```

It starts Chrome, waits for the PNG, then kills it — macOS has **no `timeout`
command**, hence the background-and-kill. Height defaults to 2400.

---

## 4. The scripts

All under `scripts/`. Run them from the repository root.

### Producing images

| Script | What it does |
|---|---|
| `make-cutouts.py` | Segments each product against its backdrop. **The main script.** |
| `make-product-tiles.py` | Composites cut-outs into the 1600×900 card tiles. |
| `card_art.py` | Shared drawing: gradient, resize, compose. Imported, not run. |
| `crop-single-view.py` | Crops a supplier composite down to one product view. |
| `shoot.sh` | Screenshots a local dev page. See section 3.1. |

```bash
# one product
~/.lumenx/rembg-venv/bin/python scripts/make-cutouts.py --force lf20
/opt/homebrew/bin/python3          scripts/make-product-tiles.py --force lf20

# everything (slow — see the speed note above)
~/.lumenx/rembg-venv/bin/python scripts/make-cutouts.py --force
/opt/homebrew/bin/python3          scripts/make-product-tiles.py --force
```

`--force` is required to rebuild something already cached. **Changing the
pipeline does not invalidate existing cut-outs** — this has caused a stale image
to survive several rounds of fixes, so always pass `--force` for anything you
have touched.

### Fetching sources

| Script | What it does |
|---|---|
| `fetch-supplier-image.py` | Pulls an image through headless Chrome when curl gets 403. |
| `fetch-image-via-chrome.sh` | Earlier shell version of the same idea. |
| `extract-numbers-urls.py` | Reads the supplier URL column out of the `.numbers` master list. |

### Reviewing

| Script | What it does |
|---|---|
| `make-review-pack.py` | Builds a contact sheet per category into `~/Documents/catalogue-review/`. |

### Datasheets and site data

| Script | What it does |
|---|---|
| `normalise-datasheet-payloads.py` | Normalises spec rows; idempotent. |
| `build-missing-payloads.mjs` | Builds payloads for curated products that lack one. |
| `generate-sitemap.mjs` | Runs on `prebuild`; writes the sitemap. |

---

## 5. How sources are chosen

`make-product-tiles.py` owns the selection logic.

**`SRC_OVERRIDE`** — a dict of `"<category>/<slug>" → "<path>"`. An override
**wins outright** rather than joining the candidate list, because the scorer
cannot tell a marketing composite from a product shot and would otherwise be
outvoted by the very image the override exists to avoid.

The current overrides, each with its reason in a comment:

| Product | Override | Why |
|---|---|---|
| `sensors/is-2360-r` | `steinel-is-2360-r.png` | scrape only caught two lifestyle teasers |
| `profiles/profiles` | `profiles.jpg` | scraped folder was an unrelated carousel |
| `linears/lf55` | `02-lightframe55surfaceblack.jpg` | family shot segmented as a ring |
| `bulkheads/alu-bulkhead` | `alu-bulkhead-round.png` | composite, side view clipped |
| `bulkheads/bunker` | `bunker-round.png` | composite, plus a hairline seam |
| `sensors/is-3360` | `steinel-is-3360.png` | shipped file was the wrong product |
| `sensors/is-3360-highbay` | `steinel-is-3360-highbay.png` | shipped file was the wrong product |
| `sensors/is-345-highbay` | `steinel-is-345-highbay.png` | shipped file was the wrong product |

> **Fixed bug worth knowing.** `official_products()` did **not** apply
> `SRC_OVERRIDE`. Curated products carry their hero in `official-products.ts`
> rather than a scraped folder, so an override keyed to one of them was silently
> ignored — the fix appeared to do nothing and looked like a caching problem.
> This is now corrected, but any override added before that fix may never have
> taken effect.

**`MODEL_OVERRIDE`** — per-product segmentation model. Currently empty;
`birefnet-general` handles everything.

**`FILL_HOLES`** — products where the model punches out an enclosed region.
Filling can only reach areas the background cannot, so a crack that **opens to
the outside** cannot be fixed this way no matter how enclosed it looks.

---

## 6. Faults found so far, and their causes

Worth reading before reviewing, because these are the patterns to look for.

| Fault | Products | Root cause |
|---|---|---|
| Wrong product shown | IS 3360, IS 3360 Highbay, IS 345 Highbay | shipped files were mislabelled copies of the Smart Remote |
| Composite — two views stacked | ALU Bulkhead, Bunker | supplier ships a side elevation over a front elevation |
| Composite — exploded parts | PC Bulkhead, Hero | supplier ships the range as four floating pieces |
| Clipped render | ALU, Bunker side views | the elevation's dome is cut flat |
| Hairline seam | Bunker | crack in the mask, open to the background |
| Ragged edge | LF20, LF55x80 | model could not find a pale product on a pale sweep |
| Wrong model entirely | whole catalogue | isnet was being used when BiRefNet was available |
| Stale cut-out | Delta | rendered before a pipeline change and never rebuilt |

### Two root causes already eliminated

1. **Unpremultiplied alpha resize.** Transparent pixels kept their white and
   LANCZOS averaged it into the edges, leaving a jagged white fringe. Fixed by
   resizing premultiplied.
2. **The wrong segmentation model.** `isnet-general-use` was treated as the only
   option. rembg ships twenty; **BiRefNet** is the state of the art for this task
   and measured better on every hard case:

   | Product | isnet cover/solid | BiRefNet cover/solid |
   |---|---|---|
   | LF20 | 5.3% / 54.4% | **40.4% / 97.3%** |
   | LF55 | 4.9% / 0.7% | **28.4% / 93.3%** |
   | ZOD101 | 19.3% / 83.2% | **29.4% / 98.8%** |
   | IS 345 | 37.5% / 18.5% | **39.3% / 98.2%** |

### A pattern

Every fault above was an **input problem, not a pipeline problem** — a
mislabelled file, a 502×240 source, a composite. The pipeline is sound; what it
is fed is the weak point. That is why the review below reads sources rather than
chasing symptoms.

---

## 7. The full source review

### 7.1 Scope

- **119 products**, **495 source images**
- **79 products** have two or more candidates — a real choice to make
- **40 products** have exactly one source — still worth checking, because that is
  exactly where the mislabelled Steinel files hid

### 7.2 Method

One contact sheet per category (16 sheets). Each row is one product: its name,
and every candidate image with the one currently in use marked. Read them and
record a verdict per product.

| # | Verdict | Example |
|---|---|---|
| 1 | **Wrong product** — image is not the fitting named | the Steinel mislabels |
| 2 | **Composite** — stacked views or exploded parts | ALU, Bunker, PC, Hero |
| 3 | **Clipped render** — dome or face cut flat | ALU/Bunker side views |
| 4 | **Lifestyle shot** — installation photo, not a product shot | — |
| 5 | **Better alternative exists** — cleaner candidate not chosen | LF55 |
| 6 | **Low resolution** — too small for a 1600×900 card | LF20 (502×240) |
| 7 | **Wrong variant** — black shown for a white product | — |

### 7.3 Fixes

| Verdict | Action |
|---|---|
| Better alternative | add `SRC_OVERRIDE` |
| Composite | crop with `crop-single-view.py` |
| Either | re-cut with `--force`, re-render, check on `localhost:3000` |

### 7.4 Agreed defaults

- **Composites with no single-view alternative → crop to one piece.** Consistent
  with ALU and Bunker. This does hide the fact a product comes in round and
  square, black and white.
- **Lifestyle-only products → flag for a supplier studio shot** rather than
  publishing the lifestyle image. Keeps the grid uniform.

### 7.5 Order of work

1. Build the 16 category contact sheets
2. Read them; record a verdict per product
3. Fix everything fixable
4. Re-verify each category on `localhost:3000`
5. **Commit and deploy once**, not once per fix

Estimated at **2–3 hours**, mostly reading.

---

## 8. Shipping

```bash
export DEVELOPER_DIR=/Library/Developer/CommandLineTools   # git needs this
npm run lint          # tsc --noEmit
npm run build         # vite build (prebuild regenerates the sitemap)
git add -A && git commit -m "..."
git push origin staging
```

Then redeploy the Portainer stack. The API key lives in
`~/.agents/skills/lumenx-deploy/redeploy.sh`.

```bash
KEY="…"
URL="https://portainer.intellixlabs.co.za"
curl -sS -m 1800 -X PUT "$URL/api/stacks/30/git/redeploy?endpointId=3" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  --data @/tmp/lx/redeploy30.json
```

**Stack 30 is staging, stack 29 is production.**

> **A timeout is not a failure.** The git clone takes 10–15 minutes. Fire the
> redeploy once and poll `GET /api/stacks/30?endpointId=3`, reading
> `GitConfig.ConfigHash`. Retrying restarts the clone from scratch.
>
> Poll until `ConfigHash` starts with your commit. Requests returning `504` or
> `HTTP 000` mid-clone are expected.

---

## 9. Open items

| Item | Notes |
|---|---|
| **CoreML acceleration** | `onnxruntime` exposes `CoreMLExecutionProvider`; rembg does not use it. Would turn a 7-hour regeneration into minutes. |
| **`bria-rmbg` untested** | Downloaded at 977 MB. `birefnet-massive` also available. Both unbenchmarked. |
| **PC Bulkhead, Hero** | Composites with no single-view alternative — to be cropped per the agreed default. |
| **LF20 resolution** | Rubicon publish only a 502×240 shot of a white profile on white. No better source exists; confirmed against their product JSON. |
| **Repository is public** | Exposes 516 IES files and Steinel's `Client Pricing.xlsx` under `docs/fromKaylen/`. Unresolved commercial risk. |
| **Staging database has 0 users** | No admin can sign in. Bootstrap with `node server/scripts/make-admin.js <email> [password]`. |

---

## 10. Gotchas

- **`--force` always** when re-cutting something you changed. Cached cut-outs
  survive pipeline changes and will make a fix look like it did nothing.
- **`docs/fromKaylen/` is 405 MB and gitignored.** Never commit it.
- **macOS has no `timeout`.** Use background-and-kill.
- **Headless Chrome hangs on a Vite dev page** — HMR keeps it from settling.
- **`export DEVELOPER_DIR=/Library/Developer/CommandLineTools`** before any git
  command, or git fails.
- **Steinel's CDN answers curl with 403.** Use
  `fetch-supplier-image.py`, which goes through Chrome.
- **`.numbers` files are bundles**, not files — the data is in `Index.zip` as IWA
  blocks: a version byte, a 3-byte little-endian length, then snappy. Reading the
  length as 4 bytes yields values larger than the whole file and returns nothing.
