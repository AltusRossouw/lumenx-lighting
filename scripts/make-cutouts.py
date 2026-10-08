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

import numpy as np
from PIL import Image

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
            if has_own_alpha(src):
                cut = Image.open(src).convert('RGBA')
            else:
                cut = remove(Image.open(src).convert('RGB'), session=session, alpha_matting=False)
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
