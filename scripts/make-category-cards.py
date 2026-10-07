#!/usr/bin/env python3
"""Build the category card images for the Products page.

Each card is a product shot composited onto the teal radial gradient the
category cards use (sampled from the original bulkheads.jpg), at 1600x900.

    python3 scripts/make-category-cards.py            # all categories in PICKS
    python3 scripts/make-category-cards.py linears    # one or more categories

Why the knockout is careful
---------------------------
Most supplier product shots are white or light-grey objects on a white
background, so a naive "remove near-white pixels" pass eats the product itself
and leaves ragged halos. The rule here is to remove only white that is
*connected to the image border*, which leaves the product's own white body
intact. Where a product is white AND touches the edge, no knockout can save it —
pick a different source image instead (that is why sensors uses the IS 2360 S
and downlights the COB Anti-glare S).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'product-images', 'categories')
W, H = 1600, 900

# category id -> [product name (for the log), source image]
PICKS = {
    'bulkheads':              ['Phoebe',                    'public/scraped/bulkheads/phoebe/01-2-1-800x431.png'],
    'downlights':             ['COB Anti-glare Downlight S', 'public/scraped/downlights/cob-anti-glare-downlight/01-cob-dr-s.png'],
    'floods':                 ['Flood',                      'public/scraped/floods/flood/01-floodlight-800x720.png'],
    'highbays':               ['ACE',                        'public/scraped/highbays/ace/01-ace-s-black-with-transparent-background.png'],
    'sensors':                ['IS 2360 S',                  'public/scraped/sensors/is-2360-s/01-17253-is-2360-eco-ohne-schatten.jpg'],
    'solar':                  ['Vista Solar Post Top',       'public/scraped/solar/vista-solar-post-top/01-pioled-lighting-vista-25w-mono-solar-post-top-3cct-rgb.jpg'],
    'linears':                ['Kepler',                     'public/scraped/linears/kepler/01-kepler-800x883.png'],
    'panels':                 ['Veris',                      'public/scraped/panels/veris/01-veris.jpg'],
    'profiles':               ['Profiles',                   'public/product-images/profiles.jpg'],
    'strips':                 ['COB',                        'public/scraped/strips/cob/01-pioled-lighting-s303-sr303-a-10w-24v-cob-ip20-strip-3000k-1.jpg'],
    'track':                  ['Bazuka',                     'public/scraped/track/bazuka/member-01-pioled-lighting-tkb099-25w-bazuka-3-wire-track-3cct-honeycomb-black.png'],
    'vapourproof':            ['Neptune',                    'public/scraped/vapourproof/neptune/01-neptune-800x416.png'],
    'decorative':             ['Dream Pen',                  'public/scraped/decorative/dream-pen/03-dreampen-s1-l1231-w617-h1178.png'],
    'indoor-architectural':   ['Circular Vertical',          'public/scraped/indoor-architectural/circular-vertical/07-aea62d768c704212-b0f107f9acc8036a-2000-1-6.png'],
    'outdoor-architectural':  ['Moal',                       'public/scraped/outdoor-architectural/moal/10-7a35dab1b5c147f9-90544533412351b0-2000.png'],
    'bollards':               ['Everest Round',              'public/scraped/outdoor-architectural/everest-round/01-pioled-lighting-fb001-12w-everest-round-ip65-bollard-4cct-black-1.png'],
}

# product height as a fraction of the card, tuned per category so every card
# carries a similar visual weight
HEIGHT = {'bollards': 0.80, 'sensors': 0.62, 'solar': 0.62, 'profiles': 0.62}
DEFAULT_HEIGHT = 0.62

KEY = (255, 0, 255)


def gradient():
    """Radial teal glow on dark navy — sampled from the original category cards."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * 0.5, H * 0.42
    d = np.clip(np.sqrt(((xx - cx) / (W * 0.62)) ** 2 + ((yy - cy) / (H * 0.62)) ** 2), 0, 1)
    t = (yy / H)[..., None]
    edge = np.array([10, 24, 35]) * (1 - t) + np.array([6, 17, 23]) * t
    core = np.array([6, 71, 89]) * (1 - t) + np.array([4, 65, 83]) * t
    k = (1 - d)[..., None] ** 1.6
    return Image.fromarray(np.clip(edge * (1 - k) + core * k, 0, 255).astype(np.uint8), 'RGB')


def strip_border_white(im):
    """Remove white only where it touches the border, preserving white products."""
    im = im.convert('RGB')
    work = im.copy()
    px = work.load()
    w, h = im.size
    for x in range(w):
        for y in (0, h - 1):
            if min(px[x, y]) >= 235:
                ImageDraw.floodfill(work, (x, y), KEY, thresh=32)
    for y in range(h):
        for x in (0, w - 1):
            if min(px[x, y]) >= 235:
                ImageDraw.floodfill(work, (x, y), KEY, thresh=32)
    a = np.array(work)
    mask = (a[:, :, 0] == KEY[0]) & (a[:, :, 1] == KEY[1]) & (a[:, :, 2] == KEY[2])
    return Image.fromarray(
        np.dstack([np.array(im), np.where(mask, 0, 255).astype(np.uint8)]).astype(np.uint8), 'RGBA')


def trim(im):
    al = np.array(im)[:, :, 3]
    ys, xs = np.where(al > 10)
    if len(xs) == 0:
        return im
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def build(src, dest, height_frac):
    im = Image.open(src)
    if np.array(im.convert('RGBA'))[:, :, 3].min() > 10:      # no real transparency
        im = strip_border_white(im)
    im = trim(im.convert('RGBA'))
    target = int(H * height_frac)
    r = target / im.height
    if im.width * r > W * 0.82:
        r = (W * 0.82) / im.width
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    base = gradient()
    base.paste(im, ((W - im.width) // 2, int((H - im.height) // 2 - H * 0.02)), im)
    base.save(dest, quality=92, optimize=True)
    return os.path.getsize(dest)


def main():
    wanted = sys.argv[1:] or sorted(PICKS)
    for cid in wanted:
        if cid not in PICKS:
            print(f'  {cid}: not in PICKS')
            continue
        name, src = PICKS[cid]
        if not os.path.exists(src):
            print(f'  {cid:24} MISSING SOURCE {src}')
            continue
        n = build(src, os.path.join(OUT, f'{cid}.jpg'), HEIGHT.get(cid, DEFAULT_HEIGHT))
        print(f'  {cid:24} {name[:26]:28} {n:>8} bytes')


if __name__ == '__main__':
    main()
