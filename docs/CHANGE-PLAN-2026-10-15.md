# LumenX site — change plan from the 15 Oct client review

**Status:** ready to implement. No code has been changed.
**Repo:** `/Users/altus/Documents/lumenx-lighting` — Vite + React 19 + TypeScript SPA, Express backend.
**Source of truth for this plan:** the client review call transcript (15 Oct) plus 16 clarification
answers supplied by Altus afterwards. Every file path, line number and data value below was read
from the working tree, not inferred.

## How to use this document

Implement in the work-package order given (W1 → W12). W1 and W2 change the shape of shared
components, so later packages assume them. Each package lists the exact files, the current code
it replaces, and acceptance criteria.

Run `npm run lint` and `npm run build` after W1–W4 and again at the end.

## Read this before touching any catalogue data

`src/catalogue-scraped.ts` is **auto-generated — do not hand-edit it.**

```
// AUTO-GENERATED from data-scrape/products — do not edit by hand.
// Run: python3 data-scrape/generate_catalogue.py
```

It is produced by `data-scrape/generate_catalogue.py` (1 400+ lines) from:
- `data-scrape/products/<Category>/<NN-supplier-slug>/{product.json,README.md,images/}`
- `data-scrape/generate_catalogue.py` — `CATEGORY_MAP` (category ids + copy),
  `EXCLUDED_PRODUCTS` (line 146), `FOLDER_CATEGORY_OVERRIDE`
- `server/datasheets-data/<fileStem>.json` — curated spec payloads
- `data-scrape/collection-specs.json`, `data-scrape/master_products.json`

The generator **wipes and rebuilds `public/scraped/`** on every run (`shutil.rmtree`, ~line 1100),
so never park hand-made files in there.

For anything the generator cannot express (product deletions, category order, brand, per-product
overrides), prefer a **small explicit post-processing step** committed as
`scripts/apply-catalogue-overrides.mjs`, run after the generator. It keeps the change reviewable
and survives regeneration. Document that step in the generator docstring.

---

# Part 1 — Decisions settled with the client

| # | Question | Decision | Implementation consequence |
|---|---|---|---|
| Q1 | Four-tile layout | **Option A** — 4 fixed slots on every product; a missing value shows a placeholder | Template must emit exactly 4 slots, never 3 |
| Q2 | Guarantee tiles | **Keep only the Guarantee tile** | Drop the "Light output guarantee" tile. The operational guarantee is the headline number |
| Q3 | Where the Solution lives | Move it to the homepage, **directly under the "One partner" block**; remove `/the-solution` as a nav tab | Keep the "One partner" heading + copy as the section intro, then render the six steps beneath it |
| Q4 | Soniq wattage | Pick the realistic specced value; discard the bogus one | Delete the `Power = 3 W` row; keep the 3-selectable-wattage wording |
| Q5 | OrbitX branding | Prefix **OrbitX products only**; add the brand name because OrbitX and LumenX have a partnership | `brand: 'orbitx'` on the 13 OrbitX products → display name `OrbitX <name>` and sort-first |
| Q6 | Streetlight | Move it | Currently mis-filed under Floodlights |
| Q7 | 600×1200 panel | **Keep the name**, fix the picture | Name stays `600x1200 Recessed Panel`; replace the tile/image only |
| Q8 | Cloud Bell images | Choose the most suitable of the available images | 12 candidates on disk; needs a human pick |
| Q9 | V200 | **Delete the product completely** | Remove the entry, no discontinued flag, page 404s |
| Q10 | IES files | **Keep downloads gated.** Missing files fall back to "contact us for the IES file" → general contact form | Do not open the downloads up |
| Q11 | Company profile | Rev 3 supplied at `catalogues/LumenX Company Profile Rev 3.pdf` | Copy over the old public PDF |
| Q12 | Kaylen banner | Keep Kaylen listed as Managing Director, **remove the banner image only** | Remove the signature image block, keep the person |
| Q13 | Images | **Pull the correct hi-res images from the supplier webpages** | Network access works from this machine |
| Q14 | Fabric Tape | Yes — the black 1200 mm 46 W round pendant | `fabric-tape-round-pendant-light-1200mm-46w-black` |
| Q15 | Category merge | Indoor Architectural + Decorative merge; **Outdoor Architectural stays separate** | Merge only those two |
| Q16 | "varis" | Remove it — it is **Veris**, and it is discontinued | Veris is the only name one letter off; product sits in `panels` |

### Two readings the implementer should know about

1. **"One partner" stays as a heading (Q3).** The client said "put it on the hero underneath the
   'one partner'". Read as: keep the existing `home.solution` heading + copy in
   `src/content.ts:220-226` as the section intro, and render the six-step Solution directly
   beneath it, replacing the six small capability cards that sit there today. If this reading is
   wrong, the fallback is to delete the heading block entirely — a one-line change either way.
   **Worth a 10-second confirm before shipping.**
2. **A correction to an earlier assumption.** The product image area on a card is **not white** —
   it is a dark blue panel (`#08202C`, `ProductDetailPage.tsx:206`). The "white backgrounds" the
   client referred to are inside the tile JPEGs, and they were accepted ("no, all good"). Do
   **not** convert product tiles to white-on-white.

---

# Part 2 — Work packages

## W1 · The four-tile spec template  *(highest impact — every product page)*

**Client's words:** *"we need to have all of these tiles possibly the same on each one, to show the
differences… my worry is that customers are going to see the 3 years and not realise it's a light
output guarantee."*

### Current behaviour

`src/components/ProductDetailPage.tsx:236-243` renders `product.specs.slice(0, 4)` — the first four
rows of whatever spec order the source scrape happened to produce. That is why the tiles differ
per product and why the guarantee can be misread.

### Target layout

Two visual columns, four fixed slots, identical on every product:

| Left column | Right column |
|---|---|
| **Guarantee** | **Wattage** |
| **IP Rating** | **Lumens / Watt** |

This is a *local rearrangement* of the four items — no new visual design. Reuse the existing tile
markup verbatim (`px-2.5 py-1.5 rounded-md bg-white/[0.02] border border-[#1E293B]/60`, label at
`text-[9px] font-mono text-slate-500 uppercase tracking-wider`, value at
`text-[11px] text-white font-medium truncate`), rendered in one `grid grid-cols-2 gap-2` where the
first column is a nested `space-y-2` holding slots 1–2 and the second holds slots 3–4.

### New helper — `src/product-tiles.ts`

Export a pure function that resolves four slots from a `Product`:

```
resolveProductTiles(product): { label: string; value: string }[]   // always length 4
```

Value precedence per slot:

| Slot | Label to show | Value source, in order |
|---|---|---|
| 1 | `Guarantee` | `product.warranty` → spec row matching `/guarantee/i` (prefer operational) → placeholder |
| 2 | `IP Rating` | spec row matching `/^ip rating$\|ingress protection/i` → placeholder |
| 3 | `Wattage` | spec row matching `/wattage\|^power$/i` → placeholder |
| 4 | `Lumens / Watt` | spec row matching `/lumen per watt\|lumens per watt\|luminous efficacy\|efficacy/i` → compute `lumens ÷ wattage` when both parse cleanly → placeholder |

Placeholder value: **`On request`**. Style it `text-slate-500 italic` so an empty slot reads as a
deliberate gap, not a broken card.

Label normalisation matters — the source data is inconsistent. For example `Blaster` carries
`Flicker Free CRI`, `RoHs IES File` and `Additional Features` as spec labels
(`src/catalogue-scraped.ts`, track/blaster). Match loosely, display tightly.

### Also required

1. **Drop the light-output guarantee** (Q2). Keep `Operational Guarantee` exactly as-is in the
   **full specification table** on the product page — only the tile is removed. This makes the
   Guarantee tile unambiguous, which was the client's actual concern.
2. **Audit guard.** Add a check that fails the build when any product has two spec rows resolving
   to the same tile key — this is exactly the Soniq defect (W8) and it will recur as data is added.
3. **Trim long values.** `truncate` is already on the value, but Soniq's "3 selectable wattages" is
   too long for a tile. Prefer `3 selectable` there.

**Acceptance:** 4 tiles on every product in every category; no product shows two tiles with the
same label; no product shows the light-output guarantee as a tile; a product with no data shows
four labelled slots reading "On request".

---

## W2 · Homepage: move the Solution under "One partner"; retire the nav tab

**Client's words:** *"move it… remove it as a tab and put it on the hero underneath the 'one partner'."*

| Step | File | Action |
|---|---|---|
| a | `src/components/HomePage.tsx:66-95` | Rewrite `SolutionTeaser`: keep the `Teaser` shell (heading + copy from `home.solution`), delete the 6-card grid at lines 77–91, and render the six-step Solution beneath the heading inside the same section |
| b | `src/components/CompleteSolutionSection.tsx` | Reuse the step markup (lines 41–85). Add a prop to suppress its own centred `<h2>`/subcopy (lines 21–31) so the homepage does not show two headings for one section |
| c | `src/components/HomePage.tsx:4` | Import `CompleteSolutionSection`; render it inside/after `SolutionTeaser` |
| d | `src/components/Header.tsx:9` | Remove `{ id: 'services', label: 'The Solution', path: '/the-solution' }` from `NAV_ITEMS` |
| e | `src/components/Footer.tsx:12` | Remove the same link from the footer list |
| f | `src/App.tsx:163-164` | `/the-solution` is no longer reachable. Replace with `<Navigate to="/#solution" replace />` so old links and bookmarks still work; drop the now-duplicate `/services` redirect (or point both at the homepage) |
| g | `src/App.tsx:65` | Remove the now-dead `SEO_MAP` entry for `/the-solution` |
| h | `src/components/ServicesPage.tsx` | Its only remaining purpose was hosting `CompleteSolutionSection`. If nothing else in the file has a home, delete the file |

`src/components/HomePage.tsx:92` holds `TeaserLink to="/the-solution"` — this link must go.

**Page flow after the change:**
`HeroSection` → `AccreditationBar` → `DifferenceCarousel` → **"One partner" + six-step Solution** →
`CategoriesTeaser` → `WhoItsForTeaser` → `CTASection`

**Acceptance:** no "The Solution" item in desktop nav, mobile nav or footer; the homepage shows the
"One partner" heading immediately followed by the six numbered steps; `/the-solution` still
resolves (redirect) rather than 404ing; no dead imports.

---

## W3 · Product cards to three per row

`src/components/ProductDetailPage.tsx:194`

```
- <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
+ <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

The category grid on `/products` is already 3-up (`ProductsPage.tsx:127`) — leave it.

**Do not** revert the `aspect-video` decision documented in the comment at lines 209–215. The tile
aspect must keep matching the card so no fitting is cropped; a wider card at 3-up still works
because the aspect ratio carves the height.

**Acceptance:** 3 cards per row at ≥1024 px; no cropping of the fitting; the 4-tile block from W1
still fits without the values colliding at 3-up. Check the widest value strings (e.g.
`12W/18W/24W`, `3000K / 4000K / 5700K`) at 1024 px.

---

## W4 · Product deletions, moves and data corrections

### 4a · Delete products entirely (Q9, Q16, A6)

| Product | Where | How |
|---|---|---|
| **V200 UFO Highbay** | `src/official-products.ts:153-163` | Delete the `createOfficialProduct` block |
| ↳ its IES files | `src/ies-product-map.ts:147-148` | Delete both `samuraiv200` entries |
| **GU10 Downlight** | `data-scrape/products/Downlights/10-pioled-gu10-gu10-downlight` | Add to `EXCLUDED_PRODUCTS` in `data-scrape/generate_catalogue.py:146` — do **not** delete the scraped folder |
| **Veris** (recessed panel, discontinued) | `data-scrape/products/Panels/` | Same — add to `EXCLUDED_PRODUCTS` |

Also purge the leftover GU10 references inside *other* products' copy:
`src/catalogue-scraped.ts` lines ~757–759 list "Colour GU10 downlighters", "Decor Colour GU10
downlighters", "Vers 3CCT GU10 downlighters" as applications. These are generated — fix the source
`README.md`/`product.json` for that product, or handle it in the override script.

### 4b · Move the streetlight out of Floodlights (Q6)

`src/official-products.ts:143-152` — `60w-street-light` currently has `category: 'floods'`.
Add a new category `street` ("Street & Area Lighting") to `CATEGORY_MAP` in the generator and in
the override step, and repoint the product. This is the client's point that *"this was a
streetlight, so it doesn't go under floodlights."*

### 4c · Deduplicate Eko and Ele (bonus defect found during review)

Each appears twice with different images — and the client flagged it on the call without knowing
the cause (*"I'm sure that one's recessed… I don't think this was supposed to be the same image"*):

| Slug | Name | Hero |
|---|---|---|
| `eko` | Eko | `09-e96e04bdf1df4e47-…-2000-1.png` |
| `eko-2` | Eko | `09-a53bc4c30f6a4d04-…-2000-1.png` |
| `ele` | Ele | `06-a279157b3f894793-…-2000-2.png` |
| `ele-2` | Ele | `06-99ff0b0537784933-…-2000-2.png` |

Both pairs come from LEDsC4 folders `01-ledsc4-eko` / `04-ledsc4-eko-2` and `05-ledsc4-ele` /
`09-ledsc4-ele-2`. Decide which of each pair is the real product and exclude the other.

### 4d · Fix Soniq's contradictory wattage (Q4)

`src/catalogue-scraped.ts`, product `linears/soniq`. It currently publishes **both**:

```
{ label: "Power",    value: "3 W" },                     ← bogus, delete
{ label: "Wattage",  value: "3 selectable wattages" },   ← keep
```

`3 W` is not a Soniq figure — the range is a 3-wattage selectable linear (LL705/LL707/LL709, per
the supplier URLs in `data-scrape/products/Linears/15-pioled-soniq/product.json`). Note
`catalogue-full.ts` maps `wattage → power` when deduping, which is why the pair slipped through.

While in there: Soniq's real W values should be confirmed and put in the full spec table.

---

## W5 · Category reorder + Indoor Architectural / Decorative merge

Current order lives in `SCRAPED_CATEGORIES` in `src/catalogue-scraped.ts`, generated from
`CATEGORY_MAP` iteration order in `data-scrape/generate_catalogue.py`.

**Current (16):** bulkheads, downlights, floods, highbays, indoor-architectural, decorative,
linears, outdoor-architectural, bollards, panels, sensors, solar, strips, profiles, track,
vapourproof

**Target:** the client wants the *common* products first — *"your panels, your vapour proofs, your
tracks"*, and *"we discussed the products to be on top, the common products."*

**Proposed order:** panels, vapourproof, track, strips, linears, downlights, highbays, bulkheads,
floods, **architectural-indoor**, outdoor-architectural, bollards, solar, profiles, sensors

Notes:
- `SENSOR_CATEGORIES` is pulled out of the lighting list via `NON_LIGHTING_CATEGORY_IDS` in
  `src/products.ts:27` — the range selector on `/products` shows "Lighting Solutions" and
  "Sensors". Keep sensors last in the lighting array; it is filtered out anyway.
- **Confirm the exact order with the client** — the transcript names panels/tracks/vapourproof but
  the rest is inference.

**Merge (Q15):** `indoor-architectural` + `decorative` → one category. Suggest id
`architectural-indoor`, title `Architectural — Indoor & Decorative`. Products to carry over:

- from `indoor-architectural`: Attic, Circular, Circular Vertical, Fabric Tape, Vetro
- from `decorative`: Cloud Bell, Crystal Cloud, Dream Pen, Jiangnan, Pearl

Implement as a `CATEGORY_MAP` merge plus a `FOLDER_CATEGORY_OVERRIDE` entry for the
`Indoor Decorative/*` folders, so the generator emits one category. **Outdoor Architectural stays
separate** — confirmed.

**Acceptance:** one combined category on `/products` with 10 products; category tile image and
description written for the merged category; no product orphaned; sitemap (`npm run build` runs
`scripts/generate-sitemap.mjs`) contains no dead category URL.

---

## W6 · OrbitX brand: prefix, sort-first, and the missing lines

**Client's words:** *"all the Orbitx fittings has got Orbitx in front"* and *"put the Orbitx in
front… I want to demonstrate that we've got fittings that's really got great guarantees."*

### 6a · Brand field

`Product.brand?: string` already needs adding to `src/types.ts` (interface `Product`, ~line 50,
next to `warranty`). Then set `brand: 'orbitx'` on exactly these **13** products
(authoritative list from `data-scrape/master_products.json`, `supplier == "OrbitX"`):

| Category | Product | Slug |
|---|---|---|
| bulkheads | Rhea | `rhea` |
| bulkheads | Phoebe | `phoebe` |
| bulkheads | Retrofit | *missing — see 6c* |
| floods | Flood | `flood` |
| highbays | Jupiter | *missing — see 6c* |
| linears | Puck Seamless | `puck-seamless` |
| linears | Puck Profile 70x36 | `puck-profile-70x36` |
| linears | Puck Profile 40x43 | `puck-profile-40x43` |
| linears | Kepler | `kepler` |
| panels | Puck Panel | *missing — see 6c* |
| strips | COB | `cob` |
| vapourproof | Neptune | `neptune` |
| vapourproof | Titan | `titan` |

Note `puck-seamless`, `puck-profile-40x43`, `puck-profile-70x36`, `neptune`, `titan`, `saxa` are
**consumed** by `official-products.ts` (`fromScraped`), so their brand must be set there too. The
scraped records for `puck-*` are additionally mis-attributed to the "Rubicon" supplier in the
scrape even though the spec PDFs are OrbitX's (`OrbitX-Puck-Profile-70x36-specifications.pdf`) —
trust the URL evidence, not the supplier column.

### 6b · Display name + ordering

- Display: `OrbitX <name>`; **slug must not change** (URL stability — 118 product pages).
  Implement as a render-time helper so it works for both curated and scraped entries, e.g.
  `displayName(product)` in `src/products.ts`.
- Ordering: branded products first, then the rest, each group alphabetical. Apply inside
  `getProductsByCategory()` in `src/products.ts:53` so every consumer inherits it
  (`ProductDetailPage`, sitemap, datasheets). This also fixes the client's *"Orbitex is supposed to
  be on the top"* in one place.

### 6c · Add the three missing OrbitX lines

Jupiter, Puck Panel and Retrofit are absent from the catalogue but **already have datasheet
payloads built** — and, importantly, **existing IES files**:

| Product | Category | Existing IES evidence | Generated datasheet |
|---|---|---|---|
| Jupiter 1200 mm | highbays | `orbitx-jupiter-1200mm-140w-17500lm.ies` | `server/cache/datasheets/jupiter.pdf` |
| Puck Panel 1200 mm | panels | `orbitx-puck-panel-1200mm-60w-6000lm.ies` | `server/cache/datasheets/puck-panel.pdf` |
| Retrofit 15 W | bulkheads | `orbitx-bulkhead-retrofit-15w.ies` | `server/cache/datasheets/retrofit.pdf` |

Source specs already extracted from `specsheets-manual/OrbitX/*.pdf` (see the reference table at the
end of this document) — use those values rather than re-scraping.

### 6d · OrbitX floodlights still to be added

The client: *"the OrbitX floods need to be added… Lots. I'll send the spec sheet. But it's only one
image."* The source PDF is present at `specsheets-manual/OrbitX/OrbitX Floodlight.pdf` and the
configurations are already extracted (see reference table), so this can proceed without waiting.

**Acceptance:** every OrbitX product renders as "OrbitX X" and sorts to the top of its category; no
slug changed; the three new products appear with datasheet + IES downloads.

---

## W7 · Tile contrast pass

On the call: *"the gray background… could we not adjust the contrast on the product itself so it's
not so white? It's just blending in there."*

`scripts/make-product-tiles.py` composes a tile onto a gradient (line ~352 calls
`card_art.strip_border_background`). Add a per-tile contrast/brightness adjustment for products
that are white-on-white, driven by an explicit allow-list of slugs so nothing else shifts.

Affected: Superlume panels, white track/linear fittings, white vapour-proof bodies.

**Do not** apply a global adjustment — it would darken the correctly-exposed tiles.

---

## W8 · Image replacements

### 8a · Images that already exist in-repo but are not wired up

Nine LumenX-branded assets sit unused in `public/product-images/`. Leda, Blaster and Kuda are
currently showing **supplier photos with the "pioled" branding visible** — which is also the
*"I need to remove the branding on this if you can"* note.

| Product | Current hero | Replace with | Also |
|---|---|---|---|
| Mario | `/scraped/downlights/mario/01-pioled-…jpg` | `/product-images/mario.png` | client asked for "a different image" |
| Blaster | `/scraped/track/blaster/01-pioled-…png` | `/product-images/blaster.png` | remove logo; **enlarge the fitting in frame** |
| Leda | `/scraped/track/leda/member-01-…png` | black variant + `/product-images/leda.png` | client: "use the black one" |
| Kuda | `/scraped/vapourproof/kuda/member-01-…png` | `/product-images/kuda.png` | client: "use a different image" |
| Soniq | `/scraped/linears/soniq/member-01-…png` | `/product-images/soniq.png` | |
| Strip lighting | blued-out LED image | `/product-images/COB_STRIP.png` | client: "the LEDs are blued out… use the COB image" |
| PC Bulkhead | tile duplicates the **Hero** product's image | a distinct PC Bulkhead shot | this is what "remove Hero" actually meant (Q: keep PC Bulkhead) |
| Cloud Bell | `/scraped/decorative/cloud-bell/03-cloudbell-s1-…webp` | pick best of 12 candidates | Q8: "choose the most suitable" |

Wire these up in `src/official-products.ts` using the existing `fromScraped(..., { hero, exclude })`
pattern (see `sauron` and `bazuka` for worked examples).

### 8b · Images to pull from supplier sites (Q13)

Network access from this machine works (`curl` to `orbitx.co.za` returned HTTP 200). Two purpose-built
fetchers already exist — use them, they handle the 403/bot-protection cases:

```
python3 scripts/fetch-supplier-image.py <url> <output.png>     # headless Chrome + letterbox trim
bash   scripts/fetch-image-via-chrome.sh <image-url> <out.png> # reports natural size for cropping
```

Also check the vendor's own asset dump first — it is often higher resolution than the website:
`specsheets-manual/OrbitX/Photos of OrbitX Products/<Product>/` contains multi-megapixel PNGs
(e.g. `Floodlight/Floodlight 20W.png`, `Puck/Puck 1200mm.png`, `Neptune/Neptune 600mm.png`).

The one URL the client supplied explicitly:

```
https://www.superlume.co.za/category/all-products?Product+type=Fabric+Tape+Lighting+Range&scrollToProduct=fabric-tape-round-pendant-light-1200mm-46w-black
```

### 8c · Blocked on clean originals

These cannot be fixed from what exists — the watermark or splash **is** the image, and retouching
was already attempted and failed:

- **Panels / vapour-proof water splashes** — *"I'm having some problems removing those water
  splashes because it's their way of showing it's waterproof."*
- **Fabric Tape** — all 24 source files are low-resolution, watermarked `.avif` from Superlume.
- **Cloud Bell** — needs the human pick (Q8), so it is decision-blocked rather than asset-blocked.

Escalate these to the client/supplier rather than attempting more retouching.

---

## W9 · IES files

Client's words: *"for those that we don't have the IES files, that you just put something there,
please contact us for IES file, and then it takes you through to the contact."* And Q10: keep
downloads gated, use the general contact form.

| Ref | Change | File |
|---|---|---|
| E1 | Products **with** IES: keep the download exactly as-is | `src/components/ProductPage.tsx:210-249` |
| E2 | Products **without**: render a `Contact us for the IES file` link → `/contact` | `src/components/ProductPage.tsx:188-208` — note the current outer guard `{(product.pdfUrl \|\| iesFiles.length > 0) && …}` hides this whole block when there are no IES files, so the fallback must sit **outside** that guard |
| E3 | Build an admin upload so the client can attach the right file to the right product | `src/components/AdminPage.tsx` + `server/` + `src/ies-product-map.ts` |
| E4 | Keep the login gate — do **not** open downloads up (Q10) | `ProductPage.tsx:198-208` |

`src/ies-product-map.ts` is currently a 21 KB hand-maintained map (~200 lines of filenames).
E3 should generate it from the server side rather than have a human edit it. There is already a
seeding script: `npm run ies:seed` → `server/scripts/seed-ies.js`.

---

## W10 · Company profile Rev 3

```
cp "catalogues/LumenX Company Profile Rev 3.pdf" public/downloads/LumenX-Company-Profile.pdf
```

Target path is fixed by `src/components/ResourcesPage.tsx:106`
(`href="/downloads/LumenX-Company-Profile.pdf"`), so overwriting in place needs no code change.
Rev 3 is 7 693 854 bytes; the currently published file is 5 529 608 bytes.
Verify the served filename and that the PDF opens before shipping.

---

## W11 · Contact page

File: `src/components/ContactSection.tsx`

| Ref | Change | Line |
|---|---|---|
| F2 | **Remove the Kaylen banner.** Delete the signature-image block; keep Kaylen listed as Managing Director (name, role, email, phone) | `320-327` — the `<div className="rounded-xl overflow-hidden …">` wrapping `MANAGING_DIRECTOR.signatureImage` |
| F2b | Remove the now-unused `signatureImage` / `signatureAlt` fields | `src/data.ts:218-219` (and the `ManagingDirector` type, `src/types.ts:131-132`) |
| F3 | **Enlarge the logo** so it matches the header logo size | `332` — `<LumenXWordmark className="h-9 mx-auto" />`. Compare against the header to pick the target height; the client said *"make this Luminex a bit bigger to match the same size as that, text on either side"* |

Do **not** remove Kaylen. Confirmed in Q12: *"yes, keep the same just remove the banner."*

---

## W12 · About page

| Ref | Change |
|---|---|
| F5 | **No group photo.** The client could not find one (*"maybe we just leave pictures out for now"*), so drop `ABOUT_TEAM_PHOTO` from the About page and use a **headshot per founder** instead — agreed on the call (*"I'll just add a nice headshot of each of you"*) |
| F5b | `public/headshots/team-kaylen-frans-placeholder.svg` is still a placeholder ("Kaylen and Frans together") and is referenced at `src/data.ts:229` and rendered at `src/components/AboutPage.tsx:96`. Replace with the founder-headshot layout |
| F5c | Only `Kaylen-Reddy-Headshot.png` exists in `public/headshots/`. **Frans's headshot is still needed** |
| F4 | **Blocked:** "the text here and there" — Franz was going to send updated About copy ("I will quickly send the change text to Altus"). Not present in the repo. Chase before implementing |

---

# Verification

```
npm run lint          # tsc --noEmit — must stay clean (baseline: clean)
npm run build         # runs scripts/generate-sitemap.mjs first
```

Regression checklist:

- [ ] 4 tiles on every product; no duplicate labels; no light-output-guarantee tile
- [ ] V200, GU10, Veris are gone; their URLs 404 gracefully
- [ ] Soniq page shows one wattage figure, not two
- [ ] No OrbitX product name duplicated in a category; all OrbitX products sort first
- [ ] `/the-solution` redirects; no dead nav/footer links; no dead `SEO_MAP` entry
- [ ] Merged architectural category has 10 products
- [ ] `/products` shows panels/vapourproof/track first
- [ ] Contact page: no signature banner, Kaylen still listed, logo size matches intent
- [ ] Company profile link downloads Rev 3 (check byte size ≈ 7.7 MB)
- [ ] IES: gated download for products that have files; "contact us" for those that don't
- [ ] 3-up product grid: no cropped fittings, no colliding tile values at 1024 px

---

# Reference A — OrbitX source specifications

Extracted from `specsheets-manual/OrbitX/*.pdf` (authoritative — prefer over the scrape). These are
exactly the four W1 tiles plus the lifetime figure.

| Product | Wattage | Efficacy | IP | Operational guarantee | Light output | Nominal lifetime |
|---|---|---|---|---|---|---|
| Jupiter | 20–200 W (20/40/60/80/100/112/120/128/140/150/160/180/200) | — | IP65 | **8 y** | 5 y | — |
| Neptune | — | 125 lm/W | **IP68** | **8 y** | 5 y | 70 000 h |
| Puck Panel | 38 W (600×600), 58 W (1200×600) | 100 lm/W | — | **6 y** | 3 y | 60 000 h |
| Retrofit module | 15 W (2 000 lm) | — | — | **6 y** | 3 y | 70 000 h |
| Floodlight | 20/35/70/150/300 W | — | **IP66** | **6 y** | 3 y | 60 000 h |
| Puck Seamless | — | 110 lm/W | — | **6 y** | 3 y | 60 000 h |
| Puck Profile 70×36 | — | 110 lm/W | — | **6 y** | 3 y | 60 000 h |
| Puck Profile 40×43 | — | 110 lm/W | — | **6 y** | 3 y | 60 000 h |
| Kepler | — | 110 lm/W | — | **8 y** | 5 y | 70 000 h |
| Titan | — | 135 lm/W | IP65 | **6 y** | 3 y | 60 000 h |

**Guarantee schedule** (`Guarantee of OrbitX lights 202601.pdf`) — operational guarantee, with the
light-output guarantee in brackets:

- Direct Drive **Jupiter, Neptune, Phoebe**: 8 years (light output 5 y)
- Direct Drive **Titan, Geminus, Puck, Rhea, T8, T5**: 6 years (light output 3 y)
- Direct Drive retrofit modules: 6 years (light output 3 y)
- Floodlights, downlights, tracklights: 5 years (light output 2 y)
- Product data already in the catalogue agrees: Phoebe `warranty: "8 years"` (line ~249)

Floodlight configurations for W6d: 20 W / 2 600 lm, 35 W / 4 500 lm, 70 W / 9 800 lm,
150 W / 18 900 lm, 300 W / 41 100 lm.

# Reference B — Junk assets to delete while in there

`public/product-images/` contains empty or zero-byte-looking stub files that are pure noise:
`60W_Street_light/`, `35W_Track_Spot/`, `ALU_BLUKHEAD/`, `COB_STRIP/`, `High_Voltage_Strip/`,
`LF55x80/`, `Linear_50x83mm/`, `Linear_50x83mm_30W:m/`, `PC_BLUKHEAD/`, `Performance_Floods/`,
`Recessed_Panel/`, `Saxa_Triproof/`, `Thermisto/`, `V200_Highbay/`, `300x1200_Recessed_Panel/`,
`48W_3_CCT_Triproof/`, `9w_Surface_downlight/`, `Aegeon_Downlight/`. Each is a directory with no
files, shadowing the real `.png` of the same name next to it. `catalogue-build/` and
`catalogues/` are also untracked build by-products (`git status` shows them as `??`).

# Reference C — Open items requiring the client

| Item | Why it is blocked |
|---|---|
| Frans's headshot | Only Kaylen's exists in `public/headshots/` |
| Updated About page copy (F4) | Franz said he would send it; not in the repo |
| Clean panel / vapour-proof originals (8c) | Watermarks and water splashes cannot be retouched out |
| Hi-res Fabric Tape imagery (8c) | All 24 sources are low-res watermarked `.avif` |
| Cloud Bell image pick (Q8) | Needs a human decision from 12 candidates |
| Exact category order (W5) | Only panels/vapourproof/track were named on the call |
| Confirm the "One partner" heading stays (Q3 reading) | 10-second confirmation before W2 ships |
