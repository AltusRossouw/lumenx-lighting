#!/usr/bin/env python3
"""Cut the products out with a segmentation model, and cache the result.

Replaces the hand-rolled knockout. A flood fill decides what to erase from pixel
colour alone, which cannot work when a white product sits on a white backdrop —
the pixel either side of the product's own outline is the same colour, so the
boundary lands wherever JPEG noise stops the fill and the result is a torn
fringe. rembg uses U^2-Net, which segments the object rather than the colour.

The cut-outs are cached under public/product-images/cutouts/ so that changing the
gradient or the layout does not mean paying for segmentation again.

Run it with the rembg interpreter, not the system one:

    ~/.lumenx/rembg-venv/bin/python scripts/make-cutouts.py [--force] [slug ...]

Set that venv up once with:

    python3 -m venv ~/.lumenx/rembg-venv
    ~/.lumenx/rembg-venv/bin/pip install "rembg[cpu,cli]"
"""
import importlib.util
import os
import sys
import time

from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'product-images', 'cutouts')

# the tile script owns source selection, so both stay in step
_spec = importlib.util.spec_from_file_location(
    'tiles', os.path.join(ROOT, 'scripts', 'make-product-tiles.py'))
tiles = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tiles)


def solidify(alpha, lo=0.30, hi=0.70):
    """Push a ghostly mask solid.

    rembg returns partial alpha for a very pale product — Leda's white track
    linear came back 63% opaque, which composites as a washed-out smear rather
    than a fitting. Stretching the mid-tones fixes it and leaves a healthy
    cut-out (94%+) essentially untouched.
    """
    f = alpha.astype(np.float32) / 255.0
    return (np.clip((f - lo) / (hi - lo), 0, 1) * 255).astype(np.uint8)


def harden(alpha, target=0.75, cut=128):
    """Binarise a mask that is still translucent after solidify().

    solidify() stretches the mid-tones, but a mask that sits broadly around 0.5
    just maps to a broad mask around 0.5 — it stays a ghost. LF40 came out 29%
    solid, Light Sensor 48%, Fabric Tape 60%: on the gradient the backdrop shows
    straight through them and they read as overlapping layers rather than a
    product.

    Anything still below `target` solid is cut at the midpoint instead, which
    keeps the segmented shape and makes it opaque. A healthy cut-out is returned
    untouched.
    """
    sub = alpha > 10
    if not sub.any():
        return alpha
    solid = (alpha >= 250)[sub].mean()
    # The tenth percentile catches a different fault from the solid share: a mask
    # can be 80% solid and still have a whole sub-assembly — Blaster's track
    # adapter — sitting at ~54% opacity, which shows the gradient through it.
    # Cut-outs that are merely soft-edged sit at 210+, so this only fires on the
    # ones that are actually see-through.
    p10 = float(np.percentile(alpha[sub], 10))
    if solid >= target and p10 >= 180:
        return alpha
    return np.where(alpha >= cut, 255, 0).astype(np.uint8)


# Products where the model left the illuminated face out of the mask. The panel
# is white and so is the backdrop, so no colour or edge test can tell them apart —
# this has to be a per-product decision rather than a heuristic.
#
# Filling holes is NOT safe as a blanket rule: rings (Circular, Proud) and wire
# pendants (Cloud Bell, Pearl, Jiangnan) legitimately enclose empty space, and
# filling those would block them in solid.
FILL_HOLES = {
    'outdoor-architectural/zod101-square-led-wall',  # glowing face punched out
    'bulkheads/bunker',                              # diffuser punched out
    # The model drops a low-contrast face from an extrusion or a diffuser and
    # leaves the rest of the silhouette around it. On the gradient the gap shows
    # as a seam running the length of the product.
    'track/leda',
    'linears/ldr6563',
    'linears/lrd9063',
    'linears/protega-gen-2',
    # NOTE: cube, cube-linear, light-sensor and ir-quattro-micro were tried here
    # and reverted — filling them took the light-emitting face or the surrounding
    # housing with it and looked worse than the seam it removed. The method can
    # only tell that a region is enclosed, not that it is part of the product.
    'sensors/service-remote',
    'panels/600x1200-recessed-panel',                # patch of the diffuser dropped
    # white detector housings on a white sweep; the model drops patches of the
    # casing. These arrived from the supplier's own product pages, so the source
    # is as good as it gets.
    'sensors/is-3360',
    'sensors/is-3360-highbay',
    'sensors/is-345-highbay',
    'solar/sky-spt-150-solar-post-top',
    # BiRefNet leaves a small notch where the trim ring meets the diffuser on this
    # housing. Both slugs are the same fitting under two names.
    'downlights/diffused-downlight',
    'downlights/cob-adjustable-downlight',
}


def fill_holes(alpha):
    """Make enclosed transparent regions opaque.

    A mask with a hole in it shows the gradient straight through the product,
    which reads as a missing panel rather than a cut-out.

    Only the alpha is touched here. rembg zeroes the colour under transparent
    pixels, so filling the alpha alone exposes black — the caller has to take the
    colour back from the source, which is what restore_holes does.
    """
    m = alpha > 10
    h, w = m.shape
    outside = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not m[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not m[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not m[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((nx, ny))
    holes = (~m) & (~outside)
    if not holes.any():
        return alpha
    return np.where(holes, 255, alpha).astype(np.uint8)


def restore_holes(cut, source_rgb):
    """Fill a cut-out's holes, taking the colour back from the source image.

    The cut-out and the source are the same size at this point, so the pixels
    line up.
    """
    a = np.array(cut)
    alpha = a[:, :, 3]
    filled = fill_holes(alpha)
    if np.array_equal(filled, alpha):
        return cut
    src = np.array(source_rgb.convert('RGB').resize(cut.size))
    rgb = np.where((filled[:, :, None] != alpha[:, :, None]), src, a[:, :, :3])
    return Image.fromarray(np.dstack([rgb, filled]).astype(np.uint8), 'RGBA')


def _largest_component(mask):
    """Keep only the biggest connected blob, so JPEG speckle is dropped."""
    img = Image.fromarray(mask, 'L')
    px = img.load()
    w, h = img.size
    seen = np.zeros((h, w), bool)
    best = []
    for y0 in range(0, h, 3):
        for x0 in range(0, w, 3):
            if px[x0, y0] <= 128 or seen[y0, x0]:
                continue
            q = deque([(x0, y0)])
            seen[y0, x0] = True
            comp = []
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny, nx] and px[nx, ny] > 128:
                        seen[ny, nx] = True
                        q.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    out = np.zeros((h, w), np.uint8)
    for x, y in best:
        out[y, x] = 255
    return out


def coverage(cut):
    """How many pixels of the frame the mask actually claims.

    This used to compare bounding-box extents, which cannot tell two masks
    apart when one has holes punched through it — Light Sensor's two candidates
    differed by six pixels of extent while one covered 47% more of the product.
    """
    return int((np.array(cut)[:, :, 3] > 128).sum())


def threshold_cutout(im):
    """Fallback for a pale product on a pale backdrop.

    The models key on contrast, and a white extrusion on a white sweep gives
    them almost nothing to find. LF20 is the case that exposed this: isnet keeps
    about 57% of the frame — a corner of the profile, with two screw holes — and
    returns it as a perfectly confident PNG. Every other model tested did the
    same or worse.

    The backdrop there is a single flat value, so the product can instead be
    taken as everything a few levels darker, cleaned of JPEG speckle and reduced
    to its largest blob. Returns None when the backdrop is not pale enough for
    that to be safe.
    """
    rgb = im.convert('RGB')
    g = np.array(rgb.convert('L')).astype(np.int16)
    band = np.concatenate([g[:4].ravel(), g[-4:].ravel(), g[:, :4].ravel(), g[:, -4:].ravel()])
    bg = int(np.bincount(band).argmax())
    if bg < 235:
        return None
    # A tight delta matters: the product's brightest faces sit within a couple of
    # levels of the backdrop, and anything looser drops them and leaves gaps.
    # A looser margin (8) was tried here to clear the anti-aliased ramp at a pale
    # product's edge, which is what leaves LF20 stepped. It fixed LF20 but put a
    # scalloped edge on IS 3360, so it is not a net win — IS 3360 is clean at 2
    # and LF20 is stepped at either. Reverted pending something that helps one
    # without costing the other.
    mask = (g < bg - 2).astype(np.uint8) * 255
    mask = np.array(Image.fromarray(mask, 'L').filter(ImageFilter.MedianFilter(5)))
    mask = _largest_component(mask)
    if mask.sum() == 0:
        return None

    # The product's brightest face sits within a level or two of the backdrop, so
    # the raw threshold picks it up in patches and leaves a chewed edge — LF20's
    # whole top face flickers in and out. Shaving a few pixels off the boundary
    # removes the fringe. Guarded, because on a thin profile that shave could
    # take the product with it.
    eroded = Image.fromarray(mask, 'L')
    for _ in range(5):
        eroded = eroded.filter(ImageFilter.MinFilter(3))
    eroded = np.array(eroded)
    if eroded.sum() >= 0.5 * mask.sum():
        mask = eroded
    return Image.fromarray(np.dstack([np.array(rgb), mask]).astype(np.uint8), 'RGBA')


# Products where a different segmentation model is clearly better.
#
# isnet-general-use wins across the catalogue and is the default, but on the
# IS 345 housing it drops the right-hand corner of the casing — and because that
# gap reaches the outer background, hole-filling cannot reach it. u2net keeps the
# whole housing. Switching the default back would disturb 119 other cut-outs, so
# this stays per-product.
# The default model. BiRefNet is the current state of the art for this task and
# measures better than isnet or u2net on every hard case in the catalogue:
#
#   product        isnet cover/solid     birefnet cover/solid
#   LF20            5.3% /  54.4%         40.4% / 97.3%
#   LF55            4.9% /   0.7%         28.4% / 93.3%
#   ZOD101         19.3% /  83.2%         29.4% / 98.8%
#   IS 345         37.5% /  18.5%         39.3% / 98.2%
#   Bunker          8.8% /  92.6% (6.9% holes)  18.0% / 97.6% (0% holes)
#
# It costs about 9s an image against 1-2s, which is the right trade for a
# catalogue that is rebuilt by hand rather than on every deploy.
DEFAULT_MODEL = 'birefnet-general'

# Per-product exceptions, for anything the default turns out to handle badly.
MODEL_OVERRIDE: dict[str, str] = {}


def chosen_source(cands):
    """The same source the tile renderer would pick.

    A SRC_OVERRIDE entry wins outright rather than merely joining the candidates
    — the scorer does not know a marketing composite from a product shot, so
    leaving it to score means the override gets outvoted by the very image it
    exists to avoid.
    """
    forced = tiles.forced_source(cands)
    if forced:
        return forced
    scored = []
    for p in cands[:tiles.MAX_CANDIDATES]:
        if not os.path.exists(p):
            continue
        r = tiles.score_candidate(p)
        if r is not None:
            scored.append((r[0], r[1], p))
    if not scored:
        return None
    strict = [s for s in scored if s[1]]
    return max(strict or scored)[2]


def has_own_alpha(path, threshold=0.05):
    """Did the supplier already cut this out?

    Their cut-out beats the model's: rembg segments whatever it judges to be the
    subject, and on High Voltage Strip it kept the coil but dropped the tail and
    connector. If the file already carries real transparency there is nothing to
    segment, so it is used as-is.
    """
    try:
        im = Image.open(path)
    except Exception:                                     # noqa: BLE001
        return False
    if im.mode not in ('RGBA', 'LA', 'P'):
        return False
    a = np.array(im.convert('RGBA'))[:, :, 3]
    return bool((a < 10).mean() > threshold)


def session_for(key, cache={}):
    """One rembg session per model, created on demand."""
    name = MODEL_OVERRIDE.get(key, DEFAULT_MODEL)
    if name not in cache:
        from rembg import new_session
        cache[name] = new_session(name)
    return cache[name]


def main():
    from rembg import new_session, remove

    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv

    # tiles.catalogue() merges scraped and curated entries, curated first. This
    # used to drop any curated entry whose slug also appeared in the scrape,
    # which silently discarded its hand-picked hero — see the note there.
    items = tiles.catalogue()
    if args:
        items = [i for i in items if i[1] in args]

    sessions = {}
    done = skipped = failed = 0
    started = time.time()

    for category, slug, name, cands in items:
        dest_dir = os.path.join(OUT, category)
        dest = os.path.join(dest_dir, f'{slug}.png')
        if os.path.exists(dest) and not force:
            skipped += 1
            continue
        src = chosen_source(cands)
        if not src:
            print(f'  SKIP  {category}/{slug:28} no usable source')
            failed += 1
            continue
        try:
            source_im = Image.open(src)
            # Bound on both branches. restore_holes() below reads it, and a
            # FILL_HOLES product whose source already carries alpha used to reach
            # that line with rgb unassigned -- an UnboundLocalError, not a
            # fallback. Nothing hit it until a cropped composite with real alpha
            # (Bunker) became a FILL_HOLES input.
            rgb = source_im.convert('RGB')
            if has_own_alpha(src):
                cut = source_im.convert('RGBA')
            else:
                cut = remove(rgb, session=session_for(f'{category}/{slug}'), alpha_matting=False)
                # On a pale backdrop, trust whichever keeps more of the product.
                # This only ever adds coverage, so it cannot make a good cut-out
                # worse; it exists because the models confidently return a corner
                # of a white fitting as if it were the whole thing.
                alt = threshold_cutout(rgb)
                if alt is not None and coverage(alt) > coverage(cut):
                    print(f'  note  {category}/{slug:28} model covered '
                          f'{100 * coverage(cut) / (rgb.width * rgb.height):.0f}%, '
                          f'threshold {100 * coverage(alt) / (rgb.width * rgb.height):.0f}%')
                    cut = alt
        except Exception as exc:                          # noqa: BLE001
            print(f'  FAIL  {category}/{slug:28} {exc}')
            failed += 1
            continue

        # trim to the subject so the tile renderer only has to scale
        a = solidify(np.array(cut)[:, :, 3])
        a = harden(a)
        if f'{category}/{slug}' in FILL_HOLES:
            cut = restore_holes(
                Image.fromarray(np.dstack([np.array(cut)[:, :, :3], a]).astype(np.uint8), 'RGBA'),
                rgb)
            a = np.array(cut)[:, :, 3]
        cut = Image.fromarray(
            np.dstack([np.array(cut)[:, :, :3], a]).astype(np.uint8), 'RGBA')
        ys, xs = np.where(a > 10)
        if len(xs):
            cut = cut.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

        os.makedirs(dest_dir, exist_ok=True)
        cut.save(dest)
        done += 1
        if done % 10 == 0:
            print(f'  ... {done} cut out ({time.time() - started:.0f}s)')

    print(f'\n  cut out {done}  cached {skipped}  failed {failed}  '
          f'in {time.time() - started:.0f}s')


if __name__ == '__main__':
    main()
