import type { Product, ProductSpec } from './types';

/**
 * The four specification tiles shown on every product card.
 *
 * The client's concern (15 Oct review): the card used to publish the first four
 * rows of whatever spec order the supplier scrape happened to produce, so the
 * tiles differed from product to product and a shopper comparing two fittings
 * could not line them up. Worse, a *light output* guarantee could be read as
 * the product's guarantee.
 *
 * So the four slots are now fixed — Guarantee, IP Rating, Wattage and
 * Lumens / Watt, in that order, on every product in every category — and the
 * guarantee slot deliberately ignores the light-output guarantee, which stays
 * in the full specification table further down the product page where it is
 * unambiguous.
 *
 * This module is pure and imports nothing but types, so the build guard
 * (`scripts/check-product-tiles.mjs`) can reuse it outside the bundle.
 */

/** Value shown when a slot has nothing to say. Reads as a deliberate gap. */
export const TILE_PLACEHOLDER = 'On request';

export interface ProductTile {
  key: TileKey;
  label: string;
  value: string;
  /** True when `value` is the placeholder, so the card can mute it. */
  placeholder: boolean;
}

export type TileKey = 'guarantee' | 'ip' | 'wattage' | 'efficacy';

/** Fixed display order and labels. Slots are never reordered or omitted. */
const TILE_ORDER: { key: TileKey; label: string }[] = [
  { key: 'guarantee', label: 'Guarantee' },
  { key: 'ip', label: 'IP Rating' },
  { key: 'wattage', label: 'Wattage' },
  { key: 'efficacy', label: 'Lumens / Watt' },
];

/* ── Label matching ─────────────────────────────────────────────────────────
 * Source labels are inconsistent — `IP Rating` and `ip-rating`, `Wattage` and
 * `Power`, `Lumens` and `Lumen Output`. Match loosely, display tightly.
 */

const normalise = (label: string): string => label.toLowerCase().replace(/\s+/g, ' ').trim();

/** Which slot, if any, a spec row feeds. */
export function tileKeyForLabel(label: string): TileKey | null {
  const l = normalise(label);

  // Guarantee. Both guarantee kinds land here, and the operational one wins
  // (see `pickSpec`), but the light-output guarantee must never become a tile
  // on its own — that was the client's actual complaint.
  if (/guarantee/i.test(l)) return 'guarantee';
  if (/warrant/i.test(l) && !/extended|registration|void/i.test(l)) return 'guarantee';

  if (/^ip[ -]?rating$/.test(l) || /ingress protection/i.test(l)) return 'ip';

  // `Power` alone is a wattage row, but "Power Factor" and "Power Supply" are
  // not — they merely start with the same word.
  if (/wattage/i.test(l)) return 'wattage';
  if (/^power$/.test(l) || /^power consumption$/.test(l) || /^nominal power$/.test(l)) {
    return 'wattage';
  }

  if (/lumen per watt|lumens per watt|luminous efficacy|efficacy/i.test(l)) return 'efficacy';

  return null;
}

/** A guarantee row that speaks to the fitting's operation, not its light output. */
const isOperationalGuarantee = (label: string): boolean => {
  const l = normalise(label);
  return !/light output|light-output|lumen maintenance|lumen output/i.test(l);
};

/* ── Value cleaning ────────────────────────────────────────────────────────
 * Tile values are rendered in an 11px box that truncates. The full text stays
 * in the specification table; the tile carries the number that matters.
 */

/**
 * Shorten a value that is too long for a tile.
 *
 * Soniq's `3 selectable wattages` is the worked example from the review: the
 * whole point of the fitting is that it ships in three selectable wattages, so
 * the tile reads `3 selectable` and the spec table keeps the sentence.
 */
export function tidyTileValue(value: string): string {
  let v = value.trim().replace(/\s+/g, ' ');
  if (!v) return '';

  // Placeholder-ish values the scrape uses instead of real data.
  if (/^(contact (our team|us)|n\/?a|none|unknown|not specified|tbc|to be confirmed)/i.test(v)) {
    return '';
  }

  // "3 selectable wattages" / "3 Selectable Wattage" -> "3 selectable"
  v = v.replace(/^(\d+)\s+selectable\s+wattages?$/i, '$1 selectable');
  // "3 selectable wattages (12W/18W/24W)" -> "3 selectable"
  v = v.replace(/^(\d+)\s+selectable\s+wattages?\b.*$/i, '$1 selectable');
  // "Selectable (3)" style leftovers read as noise in a tile.
  v = v.replace(/^selectable\s+wattages?$/i, '3 selectable');

  return v;
}

/* ── Numeric parsing, for the computed efficacy slot ─────────────────────── */

/** First standalone number in a string, ignoring thousands separators. */
function firstNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '').replace(/(\d)\s+(?=\d{3}\b)/g, '$1');
  const m = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * A meaningful wattage number for the efficacy calculation.
 *
 * Returns null for multi-wattage strings — "12W/18W/24W" and "12W - 18W" have
 * no single wattage, so dividing by either end would publish a made-up figure.
 * `firstNumber` would happily return 12 for both.
 */
function singleWattage(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim();
  // Two or more wattage figures = a selectable or ranged fitting.
  const figures = cleaned.match(/\d+(?:\.\d+)?/g) ?? [];
  if (figures.length !== 1) return null;
  return firstNumber(cleaned);
}

/** Total lumens, when the row carries a single clean figure. */
function lumensValue(spec: ProductSpec): number | null {
  const v = spec.value.trim();
  // Ranged or multi-value lumen rows have no single total.
  const figures = v.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) ?? [];
  if (figures.length !== 1) return null;
  return firstNumber(v);
}

const LUMENS_LABEL = /^(lumens|lumen output|luminous flux|light output|total lumens|rated lumens|output)$/i;

/* ── Resolution ─────────────────────────────────────────────────────────── */

/**
 * Pick the spec row for a slot.
 *
 * When the data offers more than one candidate, prefer the operational
 * guarantee over the light-output one, and otherwise take the row that
 * appeared first — the generator emits its best-known values near the top.
 */
function pickSpec(product: Product, key: TileKey): ProductSpec | undefined {
  const candidates = (product.specs ?? []).filter(
    (spec) => tileKeyForLabel(spec.label) === key && spec.value.trim(),
  );
  if (candidates.length === 0) return undefined;
  if (key !== 'guarantee') return candidates[0];

  const operational = candidates.find((spec) => isOperationalGuarantee(spec.label));
  return operational ?? candidates[0];
}

/** A spec row feeding one of the four tile slots. */
export interface TileKeyCollision {
  key: TileKey;
  labels: string[];
  /**
   * True when the extra rows are data the resolver is forced to choose between
   * — the Soniq defect, where `Power = 3 W` and `Wattage = 3 selectable
   * wattages` both claim the wattage slot and one of them must be wrong.
   *
   * False for the Guarantee slot, where carrying both an operational and a
   * light-output guarantee is intentional: the operational one is published,
   * the other stays in the spec table.
   */
  collision: boolean;
}

/** Every product with two spec rows feeding one slot. */
export function duplicateTileKeys(product: Product): TileKeyCollision[] {
  const byKey = new Map<TileKey, string[]>();
  for (const spec of product.specs ?? []) {
    if (!spec.value.trim()) continue;
    const key = tileKeyForLabel(spec.label);
    if (!key) continue;
    const labels = byKey.get(key) ?? [];
    labels.push(spec.label);
    byKey.set(key, labels);
  }
  return [...byKey.entries()]
    .filter(([, labels]) => labels.length > 1)
    .map(([key, labels]) => ({
      key,
      labels,
      // The guarantee pair is a deliberate both-and, not a collision.
      collision:
        key === 'guarantee'
          ? labels.filter(isOperationalGuarantee).length !== 1
          : true,
    }));
}

/**
 * Resolve the four tiles for one product. Always returns exactly four slots,
 * in the fixed order; a slot with no usable data reads `On request`.
 */
export function resolveProductTiles(product: Product): ProductTile[] {
  const specs = product.specs ?? [];

  // Guarantee: the curated `warranty` field first (it is hand-written and
  // already operational), then the spec rows.
  const guaranteeSpec = pickSpec(product, 'guarantee');
  const guaranteeValue =
    tidyTileValue(product.warranty ?? '') || tidyTileValue(guaranteeSpec?.value ?? '');

  const ipValue = tidyTileValue(pickSpec(product, 'ip')?.value ?? '');
  const wattageSpec = pickSpec(product, 'wattage');
  const wattageValue = tidyTileValue(wattageSpec?.value ?? '');

  // Efficacy: a stated figure wins; otherwise compute lumens ÷ wattage, which
  // only happens when both parse to a single clean number.
  let efficacyValue = tidyTileValue(pickSpec(product, 'efficacy')?.value ?? '');
  if (!efficacyValue) {
    const lumensSpec = specs.find((spec) => LUMENS_LABEL.test(spec.label.trim()));
    const lumens = lumensSpec ? lumensValue(lumensSpec) : null;
    const watts = wattageSpec ? singleWattage(wattageSpec.value) : null;
    if (lumens !== null && watts !== null) {
      const computed = Math.round(lumens / watts);
      if (computed > 0 && computed < 1000) efficacyValue = `${computed} lm/W`;
    }
  }

  const resolved: Record<TileKey, string> = {
    guarantee: guaranteeValue,
    ip: ipValue,
    wattage: wattageValue,
    efficacy: efficacyValue,
  };

  return TILE_ORDER.map(({ key, label }) => {
    const value = resolved[key];
    return {
      key,
      label,
      value: value || TILE_PLACEHOLDER,
      placeholder: !value,
    };
  });
}
