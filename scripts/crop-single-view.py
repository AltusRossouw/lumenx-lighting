#!/usr/bin/env python3
"""Crop a supplier composite down to its single main product view.

Several suppliers ship one image holding two views of a fitting stacked
vertically — usually a side elevation over a front elevation. On a product card
that reads as two products, and the side elevation is often the weaker render,
with the dome or diffuser clipped flat.

This keeps the largest connected shape, squares it on white, and pads it. It is
for the specific case where a composite has no single-view alternative; check the
supplier's other files first, as they sometimes do.

    python3 scripts/crop-single-view.py <source> <output.png> [--blob N]

--blob picks by area rank instead of the default largest, when the largest shape
is not the one wanted.
"""
import sys
from collections import deque

import numpy as np
from PIL import Image


def blobs_of(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    out = []
    for y0 in range(0, h, 3):
        for x0 in range(0, w, 3):
            if not mask[y0, x0] or seen[y0, x0]:
                continue
            q = deque([(x0, y0)])
            seen[y0, x0] = True
            comp = []
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny, nx] and mask[ny, nx]:
                        seen[ny, nx] = True
                        q.append((nx, ny))
            if len(comp) > 500:
                out.append(comp)
    return out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) < 2:
        print(__doc__)
        return 1
    src, out = args[0], args[1]
    rank = 0
    if '--blob' in sys.argv:
        rank = int(sys.argv[sys.argv.index('--blob') + 1])

    im = Image.open(src).convert('RGB')
    grey = np.array(im.convert('L')).astype(int)
    # Anything darker than the sweep. The threshold is generous because these
    # composites sit on white with soft shadows.
    blobs = blobs_of(grey < 235)
    if not blobs:
        print('  no product shape found')
        return 1
    blobs.sort(key=len, reverse=True)
    if rank >= len(blobs):
        print(f'  only {len(blobs)} shapes; cannot pick #{rank}')
        return 1
    if len(blobs) > 1:
        print(f'  {len(blobs)} shapes: ' + ', '.join(f'#{i}={len(b)}px' for i, b in enumerate(blobs[:4])))

    chosen = blobs[rank]
    xs = [p[0] for p in chosen]
    ys = [p[1] for p in chosen]
    pad = 24
    box = (max(0, min(xs) - pad), max(0, min(ys) - pad),
           min(im.width, max(xs) + pad), min(im.height, max(ys) + pad))
    crop = im.crop(box)

    side = max(crop.size) + 40
    canvas = Image.new('RGB', (side, side), (255, 255, 255))
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    canvas.save(out)
    print(f'  {im.size} -> {canvas.size}   {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
