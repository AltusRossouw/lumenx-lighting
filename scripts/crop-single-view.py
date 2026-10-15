#!/usr/bin/env python3
"""Crop a supplier composite down to its single main product view.

Several suppliers ship one image holding more than one object: two views of a
fitting — usually a side elevation over a front elevation — or the range laid
out as loose pieces. On a product card that reads as two products, which is why
ALU Bulkhead, Bunker, Hero and PC Bulkhead are all cropped this way.

There are two shapes of input and they need different treatment:

* A PNG that already carries alpha. Most of these composites do, and they need
  no colour reasoning at all: the pieces are already separate in the alpha
  channel, so the mask IS the alpha and the crop keeps its transparency.
  Thresholding those on grey was actively wrong — convert('RGB') discards the
  alpha, and the colour stored under a transparent pixel is arbitrary, so the
  whole frame came back as a single blob.
* An opaque composite (a JPEG, or a PNG on a white sweep) has to be separated by
  colour, which is what the grey threshold does.

    python3 scripts/crop-single-view.py <source> <output.png> [--blob N]

--blob picks by area rank instead of the default largest, when the largest shape
is not the one wanted.
"""
import sys
from collections import deque

import numpy as np
from PIL import Image

import card_art

MIN_BLOB = 500          # ignore speckle and JPEG noise
PAD = 24


def blobs_of(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    """Every connected True region big enough to be a thing rather than noise.

    Steps by 3 for speed, then walks with a 4-neighbour plus 2-pixel-jump
    frontier so a one-pixel gap in a thresholded outline does not split a shape.
    """
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
            if len(comp) > MIN_BLOB:
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

    im = Image.open(src)
    rgba = im.convert('RGBA')
    alpha = np.array(rgba)[:, :, 3]
    has_alpha = bool((alpha < 10).mean() > 0.05)

    if has_alpha:
        mask = alpha > 128
        how = 'alpha'
    else:
        grey = np.array(im.convert('L')).astype(int)
        # Anything darker than the sweep. The threshold is generous because
        # these composites sit on white with soft shadows.
        mask = grey < 235
        how = 'grey<235'

    blobs = blobs_of(mask)
    if not blobs:
        print('  no product shape found')
        return 1
    blobs.sort(key=len, reverse=True)
    if rank >= len(blobs):
        print(f'  only {len(blobs)} shapes; cannot pick #{rank}')
        return 1
    if len(blobs) > 1:
        print(f'  {len(blobs)} shapes ({how}): '
              + ', '.join(f'#{i}={len(b)}px' for i, b in enumerate(blobs[:4])))

    chosen = blobs[rank]

    # Keep ONLY the chosen shape, but only on the alpha path. There the blob IS
    # the object, so clearing everything else is exact — and it is necessary,
    # because the other pieces of a composite usually overlap the chosen one's
    # bounding box and fragments of them ride along (a corner of the second
    # track spot, a wire from the next pendant).
    #
    # On the grey path the blob is a threshold artefact, not a silhouette: it
    # holds only what is darker than the sweep. Masking with it eats a white
    # diffuser clean out of its own bezel — which is exactly what it did to
    # Hero, leaving a crescent. There the bounding box is the honest crop.
    xs = [q[0] for q in chosen]
    ys = [q[1] for q in chosen]
    box = (max(0, min(xs) - PAD), max(0, min(ys) - PAD),
           min(im.width, max(xs) + PAD), min(im.height, max(ys) + PAD))
    crop = rgba.crop(box)

    if has_alpha:
        # The blob IS the object here, so keeping only it is exact — and it is
        # necessary, because the other pieces of a composite usually overlap the
        # chosen one's bounding box and fragments ride along (a corner of the
        # second track spot, a wire from the next pendant).
        keep = np.zeros(mask.shape, bool)
        for x, y in chosen:
            keep[y, x] = True
        arr = np.array(crop)
        sub = keep[box[1]:box[3], box[0]:box[2]]
        arr[:, :, 3] = np.where(sub, arr[:, :, 3], 0)
        crop = Image.fromarray(arr, 'RGBA')
    else:
        # On the grey path the threshold is not a silhouette — it holds only what
        # is darker than the sweep, so a white diffuser inside a dark bezel is
        # absent from it, and an open contour cannot be hole-filled either (Hero
        # came back a crescent, Kuda a ghost). Let the shared backdrop stripper
        # do it instead: it removes only what matches the border colour AND is
        # connected to the border, which is exactly the sweep these composites
        # sit on. Skipping it left an opaque white canvas, which made
        # make-cutouts.py hand a white square to the segmenter.
        crop = card_art.strip_border_background(crop.convert('RGB'))
        # It stops at the border-connected sweep, so JPEG speckle and shadow
        # around a pale product survive as loose pixels, and a neighbouring
        # object inside the box survives whole. Keep the largest blob only.
        a0 = np.array(crop)[:, :, 3]
        blobs2 = blobs_of(a0 > 128)
        if blobs2:
            blobs2.sort(key=len, reverse=True)
            keep2 = np.zeros(a0.shape, bool)
            for x, y in blobs2[0]:
                keep2[y, x] = True
            arr2 = np.array(crop)
            arr2[:, :, 3] = np.where(keep2, arr2[:, :, 3], 0)
            crop = Image.fromarray(arr2, 'RGBA')
        else:
            crop = Image.new('RGBA', crop.size, (0, 0, 0, 0))

    # Square it on a transparent canvas so make-cutouts.py can use the alpha
    # as-is rather than re-segmenting.
    side = max(crop.size) + 40
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2), crop)
    canvas.save(out)
    print(f'  {im.size} -> {canvas.size}   kept #{rank} of {len(blobs)}   {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
