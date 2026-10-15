#!/usr/bin/env python3
"""Derive framing-corrected product shots from the full-frame originals.

Two W8a jobs need a source that is either framed too small or carries the
supplier's branding on a part that is not the product:

  blaster — `/product-images/blaster.png` shows the fitting at ~29% of the
            frame, and the driver label in the middle of it reads
            "PIOLED LIGHTING / PIO-SRU-18". The client asked to *enlarge the
            fitting in frame* and to *remove the branding*, so the crop is taken
            tight enough that both happen at once: the module fills the frame
            and the branded label falls outside it.

  leda    — the shipped `leda.png` is a three-object composite on a near-black
            backing, and the client asked for the BLACK variant in frame. The
            crop keeps the large black track linear on its own.

Run from the repo root:

    python3 scripts/make-derivative-crops.py

Writes next to the originals and never overwrites a `-single` that is not
rebuilt here. Re-running is idempotent: each output is always cut from the
pristine original, never from a previous derivative.
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCT_IMAGES = os.path.join(ROOT, 'public', 'product-images')

# src, dest, crop box in source pixels, output scale.
#
# The crop boxes are read off a 50px grid overlay of the original; the notes
# record what each edge is dodging so a later edit does not have to re-derive it.
JOBS = [
    dict(
        src='blaster.png',
        dest='blaster-crop.png',
        # left/top: clear of the faint shadow the module casts on its sweep.
        # right/bottom: the module's own edge plus a hair of white, so the shot
        # stays a cut-out on the same sweep.
        # The branded driver label sits at x 470-610, y 370-465; it is INSIDE
        # this box, so the crop alone does not remove it -- see `sun_spot`
        # below, which is what actually takes the label out of the deliverable.
        box=(255, 145, 775, 665),
        scale=2,
    ),
    dict(
        src='leda.png',
        dest='leda-single.png',
        # The shipped file is three fittings on one near-black card. The client
        # asked for the black variant in frame, so this keeps the largest single
        # object — the black circular fitting at the top — on its own.
        # Left/right stay inside the card so the crop's edge is the transparent
        # card margin, not a slice through the fitting or its neighbours.
        box=(72, 4, 228, 168),
        scale=5,
    ),
]

# Areas inside a crop that must not survive into the deliverable. Each entry is
# (job dest, box in SOURCE pixels, fill colour). For the Blaster the branded
# driver sits in the middle of the product, so it is patched with the sweep
# colour the module was photographed on rather than cropped away; that keeps the
# whole fitting in frame, which is the half of the brief a crop could not serve.
SWEEP_PATCHES = [
    ('blaster-crop.png', (450, 330, 625, 500), (241, 241, 241)),
]


def sweep_colour(im, box):
    """Median colour of a thin ring just outside `box` — the local sweep."""
    import numpy as np
    x0, y0, x1, y1 = box
    pad = 18
    ring = im.crop((max(0, x0 - pad), max(0, y0 - pad),
                    min(im.width, x1 + pad), min(im.height, y1 + pad))).convert('RGB')
    ring = ring.crop((0, 0, ring.width, pad)) if ring.height > pad * 2 else ring
    a = np.array(ring).reshape(-1, 3)
    return tuple(int(v) for v in np.median(a, axis=0))


def main():
    if not os.path.isdir(PRODUCT_IMAGES):
        sys.exit(f'no such directory: {PRODUCT_IMAGES}')
    for job in JOBS:
        src = os.path.join(PRODUCT_IMAGES, job['src'])
        dest = os.path.join(PRODUCT_IMAGES, job['dest'])
        if not os.path.exists(src):
            print(f'  SKIP  {job["dest"]}: missing {job["src"]}')
            continue
        im = Image.open(src).convert('RGBA')
        x0, y0, x1, y1 = job['box']
        if not (0 <= x0 < x1 <= im.width and 0 <= y0 < y1 <= im.height):
            sys.exit(f'  {job["dest"]}: crop {job["box"]} outside {im.size}')

        # A crop of a larger frame keeps a hard rectangular edge, so the result
        # is only usable when the source is a cut-out: the rectangle is then
        # entirely transparent and the tile composites the product alone.
        out = im.crop((x0, y0, x1, y1))
        alpha = out.getchannel('A')
        edge_opaque = max(
            alpha.crop((0, 0, out.width, 1)).getextrema()[1],
            alpha.crop((0, out.height - 1, out.width, out.height)).getextrema()[1],
            alpha.crop((0, 0, 1, out.height)).getextrema()[1],
            alpha.crop((out.width - 1, 0, out.width, out.height)).getextrema()[1],
        ) > 10

        for dest_name, pbox, fill in SWEEP_PATCHES:
            if dest_name != job['dest']:
                continue
            px0, py0, px1, py1 = pbox
            # Coordinates are given in source pixels; translate into the crop.
            box = (px0 - x0, py0 - y0, px1 - x0, py1 - y0)
            colour = fill or sweep_colour(out, box)
            patch = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), colour + (255,))
            # Feather the patch edge so it reads as sweep, not as a pasted card.
            from PIL import ImageDraw, ImageFilter
            mask = Image.new('L', patch.size, 0)
            ImageDraw.Draw(mask).rectangle([3, 3, patch.width - 4, patch.height - 4], fill=255)
            mask = mask.filter(ImageFilter.GaussianBlur(2.5))
            out.paste(patch, (box[0], box[1]), mask)

        if job['scale'] != 1:
            out = out.resize((out.width * job['scale'], out.height * job['scale']), Image.LANCZOS)
        out.save(dest)
        print(f'  WROTE {job["dest"]:22} {im.size} -> {out.size}'
              f'{"  (edge opaque: crop will show a rectangle)" if edge_opaque else ""}')


if __name__ == '__main__':
    main()
