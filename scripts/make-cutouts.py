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


def main():
    from rembg import new_session, remove

    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv

    items = tiles.products()
    items += [p for p in tiles.official_products()
              if not any(p[0] == q[0] and p[1] == q[1] for q in items)]
    if args:
        items = [i for i in items if i[1] in args]

    session = new_session('u2net')
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
            im = Image.open(src).convert('RGB')
            cut = remove(im, session=session, alpha_matting=False)
        except Exception as exc:                          # noqa: BLE001
            print(f'  FAIL  {category}/{slug:28} {exc}')
            failed += 1
            continue

        # trim to the subject so the tile renderer only has to scale
        a = np.array(cut)[:, :, 3]
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
