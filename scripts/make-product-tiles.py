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

# The flat treatment frames a whole, uncropped shot rather than a tight cut-out,
# so the product sits smaller inside the tile than it did on the gradient.
FLAT_HEIGHT_FRAC = 0.88

# Manual source overrides, keyed "<category>/<slug>".
#
# The scraper does not always end up with the supplier's product shot — some
# records only ever captured a placeholder or a lifestyle frame. Where a better
# file already exists in the repo, point at it here rather than re-scraping.
SRC_OVERRIDE = {
    # NOTE: do not "fix" smart-remote by pointing it at steinel-smart-remote.png —
    # despite the filename that file is a motion detector. The scraped image, an
    # orange app screen, is the actual product.
    # scraped only ever captured two lifestyle teasers for this one, and the
    # supplier's own page serves only a 360x360 shot. The card renders the
    # product 522px tall, so that was a 1.45x upscale. This points at the same
    # photograph through Pixelmator's 3x ML Super Resolution (1080x1080); the
    # untouched original is kept beside it as steinel-is-2360-r.png.
    'sensors/is-2360-r': 'public/product-images/steinel-is-2360-r-upscaled.png',
    # the scraped folder is a "related products" carousel of unrelated fittings
    'profiles/profiles': 'public/product-images/profiles.jpg',
    # scored highest on the family shot: a marketing composite of the range laid
    # out in a circle, which segmented as a ring with fragments inside it. The
    # clean studio shots of the same fitting are further along the folder.
    #
    # This pointed at 02-lightframe55surfaceblack.jpg, which is only 526x242 --
    # the card scales the product to 522px tall, so it was being upscaled 2.2x
    # and read soft. 06 is the same black finish as a 4652x2912 studio shot.
    'linears/lf55': 'public/scraped/linears/lf55/06-lightframe55x80.webp',
    # The shipped ALU_BLUKHEAD.png stacks a side view over a front view, and the
    # side view's dome is clipped flat. Cropped from the unclipped img-001.png to
    # the round front view alone, so the card shows one product rather than two
    # shapes with a floating dome.
    'bulkheads/alu-bulkhead': 'public/product-images/alu-bulkhead-round.png',
    # Same shape of problem: a side elevation over a front elevation, with the
    # side view's dome clipped. member-02 is the square variant, cropped to its
    # front view.
    #
    # This used to point at bunker-round.png, which was a byte-identical copy of
    # alu-bulkhead-round.png -- ALU Bulkhead and Bunker were rendering the same
    # picture on two different cards. bunker-square.png is the crop this comment
    # always described, and showing Bunker square also keeps it distinct from
    # the round ALU Bulkhead.
    'bulkheads/bunker': 'public/product-images/bunker-square.png',
    # The three is-3360/is-345 files held a copy of the Smart Remote photo and
    # steinel-smart-remote.png held a sensor, so these products were showing the
    # wrong device entirely. Pulled from the supplier's own product pages.
    'sensors/is-3360': 'public/product-images/steinel-is-3360.png',
    'sensors/is-3360-highbay': 'public/product-images/steinel-is-3360-highbay.png',
    'sensors/is-345-highbay': 'public/product-images/steinel-is-345-highbay.png',

    # Composites cropped to a single view, per the agreed default: where a
    # supplier ships more than one object in one frame and there is no
    # single-view alternative, show one object rather than the group.
    #
    # Hero and PC Bulkhead are the same four-piece exploded shot (they do appear
    # to be the same polycarbonate range sold under two names -- worth a
    # catalogue question, not an image one). Both are cropped to the round
    # panel.
    'bulkheads/hero': 'public/product-images/hero-round.png',
    'bulkheads/pc-bulkhead': 'public/product-images/pc-bulkhead-round.png',
    # Two views/finishes side by side on one sweep; each now shows one fitting.
    # The two crops also happen to read differently -- Rhea domed, Phoebe flat
    # with its fixing screws -- which keeps the two cards apart.
    'bulkheads/rhea': 'public/product-images/rhea-single.png',
    'bulkheads/phoebe': 'public/product-images/phoebe-single.png',
    # A long linear and a short one in the same frame.
    'linears/soniq': 'public/product-images/soniq-single.png',
    # Fitting plus its loose adaptor and trim ring.
    'track/snypa': 'public/product-images/snypa-single.png',
    # A white and a black spot together; one reads as two products.
    'track/35w-track-spot': 'public/product-images/35w-track-spot-single.png',
    # Three cone pendants at different sizes in one frame. The crop is only
    # 206px, so this card is soft -- flagged for a supplier shot.
    # ...and the 3x ML Super Resolution takes it to 618px, so it now downscales
    # for the card instead of being blown up 2.5x.
    'indoor-architectural/attic': 'public/product-images/attic-single-upscaled.png',
    # Every one of the twelve candidates in this folder is a 147x147 thumbnail,
    # which the card blew up 3.55x -- the worst image in the catalogue. The
    # supplier only ever published thumbnails, so this is the same photograph at
    # 441x441 via Pixelmator's 3x ML Super Resolution. Still a 1.18x upscale, but
    # no longer mush. A real studio shot is still wanted from the supplier.
    'indoor-architectural/fabric-tape': 'public/product-images/fabric-tape-upscaled.png',
    # A linear batten with an unrelated round fitting beside it. Keeps the
    # batten (--blob 1), which is the product this slug names.
    'vapourproof/kuda': 'public/product-images/kuda-single.png',

    # The rest of the range shots. Each of these put several objects on one
    # card -- a fitting with its loose driver, three sizes of the same spot, a
    # light and a black one together. Cropped to the largest single object.
    #
    # mario used to be pinned here to `mario-single.png`, the three-quarter view.
    # The curated hero is now `mario-front.png`, the front-on view cut from the
    # same composite, and a pin here would silently outrank it.
    'downlights/legend': 'public/product-images/legend-single.png',
    'downlights/sauron': 'public/product-images/sauron-single.png',
    'downlights/surface-adjustable-downlight': 'public/product-images/pakman-single.png',
    'downlights/gu10-downlight': 'public/product-images/gu10-single.png',
    'linears/lds5083': 'public/product-images/lds5083-single.png',
    'outdoor-architectural/orbit': 'public/product-images/orbit-single.png',

    # The four bollards each shipped two posts and a detached head plate. One
    # post each now -- the head still differs between Fuji and Everest, which is
    # what tells the two families apart, but the card shows one product.
    'bollards/fuji-round': 'public/product-images/fuji-round-single.png',
    'bollards/fuji-square': 'public/product-images/fuji-square-single.png',
    'bollards/everest-round': 'public/product-images/everest-round-single.png',
    'bollards/everest-square': 'public/product-images/everest-square-single.png',
}
MAX_CANDIDATES = 10

# ── W7 · white-on-white contrast pass ────────────────────────────────────────
#
# The tile is painted the colour of the product's own backdrop and everything
# ends up on white (card_art.tile_background), so a white fitting photographed
# on a white sweep lands white-on-white and the client reads it as "blending in
# there". Two of those products are worse than that: their shot is a transparent
# cut-out, so there is no sweep left to hold a seam and the body is the only
# thing in frame — it is white because the product is white, not because of a
# backdrop decision.
#
# The fix has to be per-product. A global pass would darken the 100-odd tiles
# that are correctly exposed — a black track spot, a street light, a bollard —
# which is the thing the brief explicitly rules out. So the adjustment is an
# allow-list of slugs, and each entry carries the calibration for that product.
#
# `SHADE` is the strength of a highlight shoulder applied to the pixels of the
# product ONLY (card_art.shade_product). The tile background, and every pixel
# outside the subject mask, are untouched, so the white frame the catalogue
# contract asks for stays pure white and only the body moves. 1.0 is a no-op;
# the value compresses the body's top end onto a white point of
# 200 + 55 * value. These were calibrated, not guessed: each product was swept
# until the 98th percentile of its body landed on 238 in the finished tile, which
# is a 17-level separation from the 255 frame — enough to read as a body, short
# of the point where a white fitting starts to look grey.
#
# A shoulder rather than an exposure gain, deliberately. These shots are already
# clipped in places, and a gain pulls a clipped 255 and the 244 next to it apart
# until a blown highlight turns into a hard-edged patch. On the 600x1200 panel,
# which has a large specular flare burned into its diffuser, the gain version put
# a mottled white blob across the panel that the shipped tile did not show at
# all; the shoulder keeps it as the soft flare the photograph actually has. See
# the note on card_art.shade_product.
#
# Affected families, per the brief:
#   panels   — Superlume LED panels: a flat white diffuser filling the tile.
#   track    — white track fittings.
#   linears  — white linear bodies, including the Superlume linkable range.
#   vapourproof — white vapour-proof / triproof bodies.
#
# Deliberately NOT listed: products of the same families whose shot is a dark or
# mid-grey body (snypa, metropolis, saxa, lf55, lds5083, protega, the Puck
# profiles), products the brief did not name (downlights, bulkheads, sensors)
# even where their measurement is similar, and anything whose tile is built from
# a composite where the white is a rendered backdrop rather than the product.
CONTRAST_SHADE = {
    # Superlume panels. Both are back-lit panels whose diffuser fills the tile,
    # so the body IS the white area the client is describing. The 600x1200 is the
    # catalogue's worst on measurement — 72% of its subject pixels sit above L235
    # against a pure-white frame — and it is also the one whose correction has to
    # stay restrained, because the specular flare burned into its diffuser is
    # what a stronger shoulder would turn into a visible white patch.
    #
    # Veris and Thermisto are NOT here: W5 deleted Veris from the scrape, so its
    # tile went with it, and Thermisto is a highbay rather than a panel.
    'panels/600x1200-recessed-panel': 0.78,
    'panels/recessed-panel': 0.84,
    # White track fittings. Leda is the tiltable linear whose white variant the
    # client rejected in favour of the black one; Standard and the 35W spot are
    # white-bodied after their single-object crops.
    'track/leda': 0.84,
    'track/standard': 0.78,
    'track/35w-track-spot': 0.96,
    # White linear bodies.
    'linears/lf20': 0.76,
    'linears/lf40': 0.78,
    'linears/base': 0.90,
    'linears/puck-seamless': 0.72,
    'linears/kepler': 0.72,
    # White vapour-proof bodies.
    'vapourproof/48w-3-cct-triproof': 0.98,
    'vapourproof/kuda': 0.76,
    'vapourproof/neptune': 0.70,
    'vapourproof/titan': 0.72,
    'vapourproof/vp': 0.94,
}

# The scraper sometimes filed the category banner itself as one of a product's
# gallery images — it is on the page, so it looked like a product photo. It put
# the Sensors card in three products' candidate lists and the Highbays card in
# Raptor's, where a 1600x900 banner outscored the real 300x300 product shot.
CATEGORY_CARD = re.compile(r'/product-images/categories/')

# Normalised paths that a human decision put at the head of a candidate list.
FORCED = set()


def curated_heroes():
    """<category>/<slug> -> the hero a curated entry picked, from official-products.ts.

    A curated hero is a human decision about which photo fronts a product, so it
    belongs in the same "wins outright" tier as SRC_OVERRIDE rather than the
    scoring pool. See catalogue() for why they were being ignored.
    """
    src = open(os.path.join(ROOT, 'src', 'official-products.ts')).read()
    out = {}
    for m in re.finditer(r"createOfficialProduct\(\{(.*?)\n  \}\),", src, re.S):
        b = m.group(1)
        slug = re.search(r"slug: '([^']+)'", b)
        cat = re.search(r"category: '([^']+)'", b)
        img = re.search(r"image: '([^']+)'", b)
        if slug and cat and img:
            out[f'{cat.group(1)}/{slug.group(1)}'] = 'public' + img.group(1)
    for m in re.finditer(r"fromScraped\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'(.*?)\),\n", src, re.S):
        cat, scraped, _name, rest = m.groups()
        pub = re.search(r"publicSlug: '([^']+)'", rest)
        hero = re.search(r"hero: '([^']+)'", rest)
        if hero:
            out[f'{cat}/{pub.group(1) if pub else scraped}'] = 'public' + hero.group(1)
    return out


CURATED_HERO = curated_heroes()

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
            # SRC_OVERRIDE has to be applied here too. These products carry their
            # hero in official-products.ts rather than a scraped folder, and
            # without this an override keyed to one of them was silently ignored.
            out.append((cat.group(1), slug.group(1), name.group(1) if name else slug.group(1),
                        _apply_override(cat.group(1), slug.group(1), ['public' + img.group(1)])))
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
            # _apply_override has to run in this branch too. It was only applied
            # to createOfficialProduct entries, so a hero on a fromScraped entry
            # was never recorded as forced — the same omission as the note above,
            # one branch further down.
            out.append((cat, slug, name, _apply_override(cat, slug, cands)))
    return out


def forced_source(cands):
    """The path at the head of `cands` when a human decision put it there.

    This used to re-derive the answer by scanning SRC_OVERRIDE for a matching
    value. That could not see a curated hero, so those lists looked unforced and
    went to the scorer like any other candidate. _apply_override now records
    what it forced, which is both simpler and correct.
    """
    if not cands:
        return None
    return cands[0] if os.path.normpath(cands[0]) in FORCED else None


def _apply_override(category, slug, cands):
    """Head the candidate list with a forced source, if one applies.

    SRC_OVERRIDE is checked first: it is the more specific, later decision. Any
    copy already in the list is dropped, so a forced path is never listed twice.
    """
    forced = SRC_OVERRIDE.get(f'{category}/{slug}') or CURATED_HERO.get(f'{category}/{slug}')
    if not forced:
        return cands
    full = os.path.join(ROOT, forced)
    if not os.path.exists(full):
        return cands
    FORCED.add(os.path.normpath(full))
    rest = [c for c in cands if os.path.normpath(c) != os.path.normpath(full)]
    return [full] + rest


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
            if CATEGORY_CARD.search(p):
                continue                    # the category banner is not a product photo
            full = 'public' + p
            if full not in cands:
                cands.append(full)
        out.append((category, slug, name, _apply_override(category, slug, cands)))
    return out


def catalogue():
    """Every product to render, scraped and curated merged, keyed by category/slug.

    This replaces a list comprehension that appended a curated product only when
    its slug did not already appear in the scrape. Fourteen curated entries
    collided and were dropped outright — and with them the hand-picked hero that
    is the entire point of the entry. Thirteen of those products were rendering
    whatever the scorer picked from the scraped folder while their chosen hero
    sat unused in public/product-images.

    Curated wins the collision now: its candidates head the list, so the forced
    hero still leads, and the scraped candidates follow as alternatives.
    """
    merged = {}
    for cat, slug, name, cands in products():
        merged[(cat, slug)] = (cat, slug, name, cands)
    for cat, slug, name, cands in official_products():
        key = (cat, slug)
        if key in merged:
            rest = [c for c in merged[key][3] if c not in cands]
            merged[key] = (cat, slug, name, cands + rest)
        else:
            merged[key] = (cat, slug, name, cands)
    return list(merged.values())


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
        # The supplier's lead image, and the strongest single signal there is.
        # The product page also carries accessories — remotes, cages, mounting
        # boxes — and being simple shapes they score well on their own. At a
        # smaller weight the IR Quattro Micro picked a remote control over the
        # detector, 232 to 217.
        s *= 3.5
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

    # A forced source is a human decision, so it is the answer — not a candidate.
    # This function used to score the whole list and ignore forced_source, which
    # only stayed invisible because the tile is normally composited from the
    # cached cut-out (and make-cutouts.py does honour the override). With no
    # cut-out cached, the fallback silently rendered a different image than the
    # override asked for, and --report named the scorer's pick either way.
    forced = forced_source(cands)
    if forced is not None:
        best, best_strict, best_score = forced, True, float('inf')
    else:
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
    # Flat treatment: the shot goes on a tile of its own backdrop colour, whole
    # and uncropped. The cut-out path is deliberately no longer used here -- a
    # mask is the one thing that cannot be made reliable on a pale product
    # against a pale sweep, and it is where the halos, the notches and the
    # flat-clipped domes came from.
    #
    # `shade` is the W7 white-on-white correction, and it comes from the
    # allow-list -- every product not named in CONTRAST_SHADE gets None, so the
    # pass cannot leak onto a tile that was already correctly exposed.
    card_art.compose_flat(best, dest, height_frac=FLAT_HEIGHT_FRAC,
                          shade=CONTRAST_SHADE.get(f'{category}/{slug}'))
    return 'rendered', os.path.relpath(best, ROOT), best_score


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    report = '--report' in sys.argv
    items = catalogue()
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
