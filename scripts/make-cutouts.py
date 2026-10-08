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


def extent(cut):
    """The cut-out's long edge, in pixels."""
    a = np.array(cut)[:, :, 3]
    ys, xs = np.where(a > 10)
    if not len(xs):
        return 0
    return max(xs.max() - xs.min() + 1, ys.max() - ys.min() + 1)


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
    mask = (g < bg - 7).astype(np.uint8) * 255
    mask = np.array(Image.fromarray(mask, 'L').filter(ImageFilter.MedianFilter(5)))
    mask = _largest_component(mask)
    if mask.sum() == 0:
        return None
    return Image.fromarray(np.dstack([np.array(rgb), mask]).astype(np.uint8), 'RGBA')


def chosen_source(cands):
    """The same source the tile renderer would pick."""
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


def main():
    from rembg import new_session, remove

    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv

    items = tiles.products()
    items += [p for p in tiles.official_products()
              if not any(p[0] == q[0] and p[1] == q[1] for q in items)]
    if args:
        items = [i for i in items if i[1] in args]

    # isnet-general-use, not u2net. Measured across the catalogue it is equal or
    # better on every product, and decisively better on pale fittings on pale
    # backdrops, where u2net returns a near-empty mask: profiles went 2.6% -> 95.6%
    # solid, lf20 28% -> 57%, Leda 63% -> 70%.
    session = new_session('isnet-general-use')
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
            if has_own_alpha(src):
                cut = source_im.convert('RGBA')
            else:
                rgb = source_im.convert('RGB')
                cut = remove(rgb, session=session, alpha_matting=False)
                # On a pale backdrop, trust whichever keeps more of the product.
                # This only ever adds coverage, so it cannot make a good cut-out
                # worse; it exists because the models confidently return a corner
                # of a white fitting as if it were the whole thing.
                alt = threshold_cutout(rgb)
                if alt is not None and extent(alt) > extent(cut):
                    print(f'  note  {category}/{slug:28} model kept {extent(cut)}px '
                          f'of {max(rgb.size)}, threshold kept {extent(alt)}px')
                    cut = alt
        except Exception as exc:                          # noqa: BLE001
            print(f'  FAIL  {category}/{slug:28} {exc}')
            failed += 1
            continue

        # trim to the subject so the tile renderer only has to scale
        a = solidify(np.array(cut)[:, :, 3])
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
