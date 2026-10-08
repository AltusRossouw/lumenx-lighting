#!/usr/bin/env python3
"""Render every scraped product's image onto the shared gradient.

Writes public/product-images/tiles/<category>/<slug>.jpg (1600x900). The site
uses these for the product tiles and the product-page hero, so every product
reads the same way regardless of what the supplier photo looked like.

Each product has several scraped photos and they vary a lot: clean studio shots,
lifestyle interiors, marketing composites with a logo burned in, and supplier
placeholders. Rather than trusting the first image, this scores the candidates
and keeps the one that produces the cleanest tile.

    python3 scripts/make-product-tiles.py                # everything missing
    python3 scripts/make-product-tiles.py --force        # rebuild all
    python3 scripts/make-product-tiles.py mario gu10     # named products
    python3 scripts/make-product-tiles.py --report       # just score, no writes
"""
import os
import re
import sys
import time

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import card_art  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'product-images', 'tiles')

HEIGHT_FRAC = 0.58
MAX_CANDIDATES = 10

# Filenames that are drawings, tables or wiring diagrams rather than product
# photography. They score well on size and aspect but put a spec table or a
# "see configurations" panel on the card.
# Supplier photo naming tells you a lot. LEDsC4 publish the real product shot as
# "01-web-mainimage-<product>", and their ambience/interior shots as "amb", plus
# CDN renders under a long hex hash. The scraper's chosen hero is frequently one
# of the latter, so the score has to prefer the main image.
PHOTO_MAIN = re.compile(r'web-mainimage|mainimage|main-image', re.I)
PHOTO_FIRST = re.compile(r'^0?1[-_]')             # the supplier's first image
PHOTO_RELATED = re.compile(r'^member[-_]', re.I)  # "related products" carousel thumb
PHOTO_SCENE = re.compile(
    r'(?:^|[-_ ])(amb|ambient|moodbild|scene|application|install|project|teaser|grp|detail)', re.I)
HASHY = re.compile(r'[0-9a-f]{16,}', re.I)

# Anchored on a separator, so "tiltable" is not read as "table".
NOT_PHOTO = re.compile(
    r'(?:^|[-_ ])(dimension|schematic|drawing|diagram|schaltplan|wiring|table|'
    r'spec|datasheet|config|annotat|callout|infographic)',
    re.I)


def official_products():
    """Curated products, keyed by the slug they publish under.

    They have their own chosen hero in /product-images, so they only need the
    shared treatment applied — the tile is what makes the grid look uniform.
    """
    src = open(os.path.join(ROOT, 'src', 'official-products.ts')).read()
    out = []
    for m in re.finditer(r"createOfficialProduct\(\{(.*?)\n  \}\),", src, re.S):
        b = m.group(1)
        slug = re.search(r"slug: '([^']+)'", b)
        cat = re.search(r"category: '([^']+)'", b)
        img = re.search(r"image: '([^']+)'", b)
        name = re.search(r"name: '([^']+)'", b)
        if slug and cat and img:
            out.append((cat.group(1), slug.group(1), name.group(1) if name else slug.group(1),
                        ['public' + img.group(1)]))
    for m in re.finditer(r"fromScraped\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'(.*?)\),\n", src, re.S):
        cat, scraped, name, rest = m.groups()
        hero = re.search(r"hero: '([^']+)'", rest)
        pub = re.search(r"publicSlug: '([^']+)'", rest)
        slug = pub.group(1) if pub else scraped
        cands = []
        if hero:
            cands.append('public' + hero.group(1))
        for g in re.findall(r"\{ src: '([^']+)'", rest):
            cands.append('public' + g)
        if cands:
            out.append((cat, slug, name, cands))
    return out


def products():
    """Every scraped product with its candidate images, hero first."""
    src = open(os.path.join(ROOT, 'src', 'catalogue-scraped.ts')).read()
    blocks = re.findall(
        r'\n  \{\n    slug: "([^"]+)",\n    name: "([^"]+)",\n    category: "([^"]+)",(.*?)\n  \},',
        src, re.S)
    out = []
    for slug, name, category, body in blocks:
        hero = re.search(r'imageUrl: "([^"]+)"', body)
        gallery = re.findall(r'\{ src: "([^"]+)"', body)
        cands = []
        for p in ([hero.group(1)] if hero else []) + gallery:
            full = 'public' + p
            if full not in cands:
                cands.append(full)
        out.append((category, slug, name, cands))
    return out


def score_candidate(path):
    """Score how good a tile this source would make.

    Returns (score, strict) where `strict` means the image produced a clean
    cut-out. Non-strict candidates are still usable — they just keep more of
    their original backdrop — so they are only chosen when nothing strict
    exists. Returns None only when the file cannot be used at all.
    """
    if NOT_PHOTO.search(os.path.basename(path)):
        return None
    try:
        im = Image.open(path)
    except Exception:                                     # noqa: BLE001
        return None
    w, h = im.size
    # 147px supplier thumbnails still beat having no picture at all, so they are
    # allowed through at a lower score rather than dropped.
    tiny = w < 200 or h < 200
    if w < 110 or h < 110:
        return None

    bg, share = card_art._dominant_border_colour(im)
    has_alpha = np.array(im.convert('RGBA'))[:, :, 3].min() < 10

    if has_alpha:
        stripped_share = 0.0
        strict = True
        prepared = card_art.prepare(path)
    else:
        if share < 0.50:
            # no uniform backdrop: it is a lifestyle or composite shot. Only
            # worth using if nothing else exists.
            strict = False
            stripped_share = 0.0
            prepared = card_art.prepare(path)
        else:
            stripped = card_art.strip_border_background(im)
            a = np.array(stripped)[:, :, 3]
            stripped_share = float((a < 10).mean())
            strict = stripped_share >= 0.30
            prepared = card_art.prepare(path)

    pw, ph = prepared.size
    if pw < 90 or ph < 90:
        return None
    AR = pw / ph
    # Bollards, posts and strip lights are genuinely thin. Rejecting those as
    # "slivers" pushed the score onto an ambience photo instead, which is how
    # Helion ended up with a picture of a house at dusk.
    if AR > 12 or AR < 0.035:
        return None

    fill = (pw * ph) / (w * h)
    centre_bonus = 1.0 - min(abs(AR - 1.3) / 2.0, 0.5)
    # Resolution is only a tie-breaker. Weighted any harder, a 2500px ambience
    # photo beat the 480px shot of the actual product.
    resolution = min((w * h) / 1_000_000, 3.0) ** 0.5
    s = 100.0
    s *= 0.4 + min(fill, 0.6) * 1.4
    s *= 0.75 + stripped_share * 0.6
    s *= centre_bonus
    s *= 0.85 + resolution * 0.15
    s *= 1.0 + min((pw * ph) ** 0.5 / 1400, 0.6)
    base = os.path.basename(path)
    if PHOTO_MAIN.search(base):
        s *= 6.0                                          # the supplier's own product shot
    if PHOTO_FIRST.search(base):
        s *= 1.8                                          # the supplier's lead image
    if PHOTO_RELATED.search(base):
        s *= 0.30                                         # a different product's thumbnail
    if PHOTO_SCENE.search(base):
        s *= 0.08                                         # an ambience/lifestyle frame
    if HASHY.search(base):
        s *= 0.55                                         # CDN render, usually not the product
    if not strict:
        s *= 0.25                                         # last resort only
    if tiny:
        s *= 0.2
    return s, strict and not tiny


def render(category, slug, name, cands, force=False, report=False):
    dest_dir = os.path.join(OUT, category)
    dest = os.path.join(dest_dir, f'{slug}.jpg')
    if os.path.exists(dest) and not force and not report:
        return 'skipped', None, None

    scored = []
    for p in cands[:MAX_CANDIDATES]:
        if not os.path.exists(p):
            continue
        r = score_candidate(p)
        if r is not None:
            scored.append((r[0], r[1], p))
    if not scored:
        return 'no-usable-image', None, None
    # prefer a clean cut-out; fall back to the best of the rest
    strict = [s for s in scored if s[1]]
    best_score, best_strict, best = max(strict or scored)

    if report:
        tag = '' if best_strict else '  (no clean cut-out)'
        return 'scored', os.path.relpath(best, ROOT) + tag, best_score

    os.makedirs(dest_dir, exist_ok=True)
    card_art.compose(best, dest, height_frac=HEIGHT_FRAC)
    return ('rendered' if best_strict else 'rendered-fallback'), os.path.relpath(best, ROOT), best_score


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    report = '--report' in sys.argv
    items = products()
    items += [p for p in official_products()
              if not any(p[0] == q[0] and p[1] == q[1] for q in items)]
    if args:
        items = [i for i in items if i[1] in args]

    counts = {}
    problems = []
    started = time.time()
    for i, (category, slug, name, cands) in enumerate(items, 1):
        status, src, s = render(category, slug, name, cands, force, report)
        counts[status] = counts.get(status, 0) + 1
        if status in ('no-usable-image',):
            problems.append((category, slug, name))
        if report and status == 'scored':
            print(f'  {category:22} {slug:26} {s:6.1f}  {src}')
        elif i % 25 == 0:
            print(f'  ... {i}/{len(items)}  ({time.time() - started:.0f}s)')

    print(f'\n  {counts}  in {time.time() - started:.0f}s')
    if problems:
        print(f'\n  products with no usable image ({len(problems)}):')
        for c, s, n in problems:
            print(f'    {c:22} {s:26} {n[:34]}')


if __name__ == '__main__':
    main()
