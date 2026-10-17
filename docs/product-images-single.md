# Products with a single image

Generated 2026-10-17 from the published catalogue (`src/catalogue-full.ts`).

## What this counts

Every product page is headed by a generated tile (`/product-images/tiles/<category>/<slug>.jpg`). `withTile()` in `src/catalogue-full.ts` replaces the supplier hero with that tile and removes the hero from the gallery, so a product whose catalogue record has only one image renders as a single image. This list is the set of products still in that state after the Oct 2026 image import.

**46 of 117 products** still show one image (down from 51 before the import).

| Reason | Products |
|---|---:|
| Scrape has no extra photos | 19 |
| Curated single hero (by design) | 15 |
| Scrape blocked / no source | 7 |
| Watermarked supplier renders excluded | 4 |
| Scrape photos belong to child SKUs | 1 |

## Fixed in the Oct 2026 import

| Product | Images added | Now |
|---|---:|---:|
| COB Adjustable Downlight (lean-153) | 3 | 4 |
| Sauron | 1 | 2 |
| Everest Round | 1 | 2 |
| COB Strip | 1 | 2 |
| Blaster | 3 | 4 |

## Still one image

| Category | Product | Slug | Reason |
|---|---|---|---|
| architectural-indoor | Crystal Cloud | `crystal-cloud` | Watermarked supplier renders excluded |
| architectural-indoor | Dream Pen | `dream-pen` | Watermarked supplier renders excluded |
| architectural-indoor | Jiangnan | `jiangnan` | Watermarked supplier renders excluded |
| architectural-indoor | Pearl | `pearl` | Watermarked supplier renders excluded |
| bollards | Everest Square | `everest-square` | Scrape has no extra photos |
| bollards | Fuji Round | `fuji-round` | Scrape has no extra photos |
| bollards | Fuji Square | `fuji-square` | Scrape has no extra photos |
| bulkheads | ALU Bulkhead | `alu-bulkhead` | Curated single hero (by design) |
| bulkheads | PC Bulkhead | `pc-bulkhead` | Curated single hero (by design) |
| bulkheads | Retrofit Module 15W | `retrofit-module` | Curated single hero (by design) |
| downlights | 9W Surface Downlight | `9w-surface-downlight` | Curated single hero (by design) |
| downlights | COB Square Double Downlight | `cob-square-double-downlight` | Scrape has no extra photos |
| downlights | COB Square Downlight | `cob-square-downlight` | Scrape has no extra photos |
| downlights | Small COB Anti-glare Downlight | `small-cob-anti-glare-downlight` | Scrape has no extra photos |
| floods | Floodlight | `orbitx-floodlight` | Curated single hero (by design) |
| highbays | Delta | `delta` | Scrape has no extra photos |
| highbays | Jupiter 1200mm | `jupiter` | Curated single hero (by design) |
| highbays | Raptor | `raptor` | Scrape photos belong to child SKUs |
| linears | BASE | `base` | Scrape has no extra photos |
| linears | Kepler | `kepler` | Scrape has no extra photos |
| linears | LDR6563 | `ldr6563` | Scrape has no extra photos |
| linears | LRD9063 | `lrd9063` | Scrape has no extra photos |
| linears | Soniq | `soniq` | Curated single hero (by design) |
| outdoor-architectural | Orbit | `orbit` | Scrape has no extra photos |
| outdoor-architectural | Vista | `vista` | Scrape has no extra photos |
| outdoor-architectural | ZOD101 Square LED Wall | `zod101-square-led-wall` | Scrape has no extra photos |
| outdoor-architectural | ZOD102 Round LED Wall | `zod102-round-led-wall` | Scrape has no extra photos |
| panels | 600x1200 Recessed Panel | `600x1200-recessed-panel` | Curated single hero (by design) |
| panels | Puck Panel 1200mm | `puck-panel` | Curated single hero (by design) |
| panels | Recessed Panel | `recessed-panel` | Curated single hero (by design) |
| sensors | DualTech | `dualtech` | Scrape blocked / no source |
| sensors | IS 2180 | `is-2180` | Scrape blocked / no source |
| sensors | IS 2360 S | `is-2360-s` | Scrape blocked / no source |
| sensors | IS 3360 | `is-3360` | Scrape blocked / no source |
| sensors | IS 3360 Highbay | `is-3360-highbay` | Scrape blocked / no source |
| sensors | IS 345 Highbay | `is-345-highbay` | Scrape blocked / no source |
| sensors | Service Remote | `service-remote` | Scrape blocked / no source |
| solar | Sky ELE-15 Solar Post Top | `sky-ele-15-solar-post-top` | Scrape has no extra photos |
| solar | Sky SPT-150 Solar Post Top | `sky-spt-150-solar-post-top` | Scrape has no extra photos |
| solar | Vista Solar Post Top | `vista-solar-post-top` | Scrape has no extra photos |
| street | 60W Street Light | `60w-street-light` | Curated single hero (by design) |
| strips | High Voltage Strip | `high-voltage-strip` | Curated single hero (by design) |
| track | 35W Track Spot | `35w-track-spot` | Curated single hero (by design) |
| vapourproof | 48W 3 CCT Triproof | `48w-3-cct-triproof` | Curated single hero (by design) |
| vapourproof | Kuda | `kuda` | Curated single hero (by design) |
| vapourproof | VP | `vp` | Scrape has no extra photos |

## Notes

- **Curated single hero** — the product is defined in `src/official-products.ts` with one chosen hero (and sometimes explicit excludes). More supplier photos would need a curation decision, not an import.
- **Watermarked supplier renders excluded** — the Kinglong decorative ranges have the supplier watermark burned into every render; the gallery intentionally uses a single installation shot instead (`PRODUCT_PHOTO_OVERRIDES` in `scripts/apply-catalogue-overrides.mjs`).
- **Scrape blocked / no source** — the Steinel sensor pages are still blocked by the supplier; no additional photos exist in the Oct 2026 scrape.
- **Scrape photos belong to child SKUs** — Raptor is scraped as a five-SKU family; the photos are per-variant and were not promoted to the range page.
- **Scrape has no extra photos** — the supplier page itself only carries the one shot, or every other scraped photo was already published (perceptual-hash dedupe).
