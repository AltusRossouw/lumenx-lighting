#!/usr/bin/env python3
"""Derive framing-corrected product shots from the full-frame originals.

Three W8a jobs need a source that is framed too small, is a multi-view composite,
or carries the supplier's branding on a part that is not the product:

  blaster — the supplier's own studio shot
            (`scraped/track/blaster/01-pioled-…-white-c.png`) is the correct
            TKW101 track spot, but the fitting occupies only about half the
            frame and the driver label on the track adapter reads
            "PIOLED LIGHTING / PIO-TK-8-35". The client asked to *enlarge the
            fitting in frame* and to *remove the branding*, so the job crops in
            and inpaints the label off the adapter.

            NOTE: `/product-images/blaster.png` is NOT this fitting. That file
            is an 18W PioLED magnetic ceiling module (PIO-SRL-18W) and was
            mislabelled for a while, which is what put the wrong product on the
            Blaster product page. It is kept, renamed, as
            `unidentified-led-ceiling-module-18w.png`. Do not point this job at
            it again.

  mario   — the supplier ships one 1024px composite of three views. The client
            picked the top-right (tilted) view as the main picture and asked for
            the main picture to be that single view rather than the composite;
            the composite stays in the gallery. The third view sits close enough
            that its fin reaches into the crop, so `ISOLATE` drops it.

  leda    — `/product-images/leda.png` is a three-object card of HIGH-BAY
            fittings. It is the wrong product entirely, and it is what put a high
            bay on the Leda card. The real Leda is a 3-wire track tiltable
            linear, and the scrape has it: the job is cut from the black 4ft one
            (the client asked for the black variant). `leda.png` is kept, renamed,
            as `unidentified-highbay-composite.png`.

Run from the repo root:

    python3 scripts/make-derivative-crops.py

Writes next to the originals. Re-running is idempotent: each output is always
cut from the pristine original, never from a previous derivative.
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
PRODUCT_IMAGES = os.path.join(PUBLIC, 'product-images')

# src, dest, crop box in source pixels, output scale.
#
# `src` is relative to `public/`, so a job can read either a shipped asset in
# `product-images/` or the untouched scrape in `scraped/`.
#
# The crop boxes are read off a 50px grid overlay of the original; the notes
# record what each edge is dodging so a later edit does not have to re-derive it.
JOBS = [
    dict(
        # The real Blaster. Product bbox is x 271-768, y 337-744, so a 560px
        # square centred on it leaves ~31px either side and ~76px above and
        # below — the fitting fills the frame instead of sitting in the middle
        # of it, which is the half of the brief a crop alone can serve.
        src='scraped/track/blaster/01-pioled-lighting-tkw101-blaster-high-power-3-wire-track-spot-white-c.png',
        dest='blaster-track.png',
        box=(240, 260, 800, 820),
        scale=2,
    ),
    dict(
        # The supplier composite is three views on one 1024px sheet. The client
        # picked the TOP-RIGHT view — the tilted one — as Mario's main picture,
        # and asked for the main picture to be that single view rather than the
        # composite. The composite stays in the gallery behind it.
        #
        # That panel is x 517-969, y 48-578, so a 550px square centred on it
        # leaves ~16px above and below and ~55px either side.
        #
        # The third view sits below and reaches up into y 545-590 across
        # x 415-720, i.e. into this box; ISOLATE takes it out.
        src='scraped/downlights/mario/01-pioled-lighting-hd020-35w-mario-led-round-tilt-downlight-3cct-1.jpg',
        dest='mario-tilt.png',
        box=(468, 38, 1018, 588),
        scale=2,
    ),
    dict(
        # The real Leda: the black 4ft 3-wire track tiltable linear. Content is
        # x 27-572, y 168-400 on a 600px sheet, so the box adds a ~10px margin
        # and the 2x takes the long edge back over 1000px for the tile.
        src='scraped/track/leda/member-01-pioled-lighting-tk005-4ft-leda-3-wire-track-tiltable-linear-3cct-600x6.png',
        dest='leda-single.png',
        box=(10, 150, 590, 420),
        scale=2,
    ),
]

# Supplier branding printed on the product itself, and the box in SOURCE pixels
# that holds it. The box must sit wholly inside that job's crop, or the label
# would be cut off rather than cleaned.
#
# The label is dark ink on a flat white moulding, so it is inpainted rather than
# patched with a solid colour: the adapter has a soft shading gradient across it
# and a flat rectangle of white reads as a pasted card at tile size.
BRANDING = [
    # "PIOLED LIGHTING / PIO-TK-8-35 / 200-265V 50/60H / 35W 3CCT 4025L /
    # 2606W5" on the Blaster's track adapter. Measured ink bounds are
    # x 273-379, y 359-417; the box adds a few px so the anti-aliased halo goes
    # with it. The product's own left edge is x 271, so this stops short of it.
    ('blaster-track.png', (269, 355, 385, 421)),
]

# Ink threshold. The adapter face measures 250-253, the background is 255.
INK_LEVEL = 235
# Inpaint radius. The glyph strokes are ~2px at source resolution.
INPAINT_RADIUS = 3

# Jobs whose crop can catch a corner of the view next to it in a supplier
# composite. Handled by keeping only the largest blob of non-white pixels in the
# crop and flattening the rest to the sweep.
#
# This cannot be done with a luminance threshold: the neighbour's anti-aliased
# edge measures lighter (167-250) than parts of the product that must be kept
# (Mario's cone sits at 207-213). The two never touch, though, so they come apart
# cleanly as connected components.
ISOLATE = ['mario-tilt.png']


def debrand(im, box):
    """Inpaint the supplier's branding out of `box` (source pixels).

    Returns the patched image. Falls back to a flat fill only if OpenCV is
    missing, which keeps the script runnable on a bare interpreter.
    """
    x0, y0, x1, y1 = box
    region = np.asarray(im.convert('RGB'))[y0:y1, x0:x1]

    # Ink is anything meaningfully darker than the moulding it sits on.
    mask = (region.mean(axis=2) < INK_LEVEL).astype(np.uint8)
    if not mask.any():
        return im, 0

    # Grow by a pixel so the anti-aliased edge of each glyph goes too.
    grown = np.zeros_like(mask)
    grown[1:, :] |= mask[:-1, :]
    grown[:-1, :] |= mask[1:, :]
    grown[:, 1:] |= mask[:, :-1]
    grown[:, :-1] |= mask[:, 1:]
    mask = np.maximum(mask, grown)

    try:
        import cv2
    except ImportError:
        fill = np.median(region[mask == 0].reshape(-1, 3), axis=0)
        region[mask == 1] = fill
        out = im.copy()
        out.paste(Image.fromarray(region).convert('RGBA'), (x0, y0))
        return out, int(mask.sum())

    full = np.zeros((im.height, im.width), dtype=np.uint8)
    full[y0:y1, x0:x1] = mask * 255
    patched = cv2.inpaint(np.asarray(im.convert('RGB')), full, INPAINT_RADIUS, cv2.INPAINT_TELEA)
    # cv2 works in RGB and drops any alpha, so put the original mask back.
    out = Image.fromarray(patched).convert('RGBA')
    out.putalpha(im.convert('RGBA').getchannel('A'))
    return out, int(mask.sum())


def isolate_dominant(im, threshold=248, grow=4):
    """Whiten every blob of non-white pixels except the largest one.

    `im` must already be cropped, so only content actually inside the frame is
    considered. Returns the cleaned image and the number of pixels flattened.
    """
    from scipy import ndimage

    a = np.asarray(im.convert('L')).astype(int)
    mask = a < threshold
    if not mask.any():
        return im, 0

    # Grow before labelling so a product broken into several parts (a separate
    # black bezel, a detached spring clip) still counts as one blob.
    lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=grow))
    if n <= 1:
        return im, 0

    sizes = np.bincount(lab.ravel())
    sizes[0] = 0                      # 0 is the dilated background, not a blob
    keep = int(sizes.argmax())

    # Drop the *undilated* pixels, so the kept product keeps its soft edge.
    drop = mask & (lab != keep)
    if not drop.any():
        return im, 0

    # These composites are shot on a pure white sweep, so match it rather than
    # sampling — there is no gradient here to preserve.
    out = np.asarray(im.convert('RGB')).copy()
    out[drop] = (255, 255, 255)
    return Image.fromarray(out).convert('RGBA'), int(drop.sum())


def main():
    if not os.path.isdir(PRODUCT_IMAGES):
        sys.exit(f'no such directory: {PRODUCT_IMAGES}')
    for job in JOBS:
        src = os.path.join(PUBLIC, job['src'])
        dest = os.path.join(PRODUCT_IMAGES, job['dest'])
        if not os.path.exists(src):
            print(f'  SKIP  {job["dest"]}: missing {job["src"]}')
            continue
        im = Image.open(src).convert('RGBA')
        x0, y0, x1, y1 = job['box']
        if not (0 <= x0 < x1 <= im.width and 0 <= y0 < y1 <= im.height):
            sys.exit(f'  {job["dest"]}: crop {job["box"]} outside {im.size}')

        # Take the branding out of the source first, so the crop box stays the
        # framing decision and nothing has to be patched after the resize.
        branded = 0
        for dest_name, bbox in BRANDING:
            if dest_name != job['dest']:
                continue
            bx0, by0, bx1, by1 = bbox
            if not (x0 <= bx0 and bx1 <= x1 and y0 <= by0 and by1 <= y1):
                sys.exit(f'  {job["dest"]}: branding box {bbox} is not inside crop {job["box"]}')
            im, branded = debrand(im, bbox)

        # Crop first, then isolate — so only neighbours that are actually inside
        # the frame are considered, and the ones left outside cannot win.
        out = im.crop((x0, y0, x1, y1))

        cleared = 0
        if job['dest'] in ISOLATE:
            out, cleared = isolate_dominant(out)

        if job['scale'] != 1:
            out = out.resize((out.width * job['scale'], out.height * job['scale']), Image.LANCZOS)
        # Kept in RGBA: a cut-out source's transparent margin is what lets the
        # tile composite the fitting on its own. Flattening to RGB would put a
        # black rectangle behind it.
        out.save(dest)
        print(f'  WROTE {job["dest"]:22} {im.size} -> {out.size}'
              f'{"  (de-branded " + str(branded) + "px)" if branded else ""}'
              f'{"  (isolated, dropped " + str(cleared) + "px)" if cleared else ""}')


if __name__ == '__main__':
    main()
