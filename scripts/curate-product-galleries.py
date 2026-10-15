#!/usr/bin/env python3
"""Keep only the images that belong on a product's carousel.

The scraper attached every image it found on a supplier page, so galleries carry
things that are not this product: the Smart Remote's own photo in four different
sensor galleries, a wiring diagram, and -- because the category banner is on the
page too -- the Sensors banner in three products' carousels.

An image is kept when it is plausibly about this product:

* not the hero. The hero already heads the carousel; showing it twice is waste.
* not a wiring diagram. Those belong in Technical Resources.
* not another product's picture. Detected by content hash: if the same bytes are
  a candidate or hero of a different product, they are that product's photo.
* not the category banner.

Dimension drawings are KEPT -- they are this product's dimensions, and the
printed catalogue treats them as gallery material too. Lifestyle and installation
frames are KEPT for the same reason.

    python3 scripts/curate-product-galleries.py --dry-run
    python3 scripts/curate-product-galleries.py
"""
import hashlib
import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, 'scripts'))

_spec = importlib.util.spec_from_file_location(
    'tiles', os.path.join(ROOT, 'scripts', 'make-product-tiles.py'))
tiles = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tiles)

DIAGRAM = re.compile(r'(?:^|[-_ ])(schaltplan|schematic|wiring|anschluss|circuit)', re.I)


def md5(p):
    try:
        with open(p, 'rb') as fh:
            return hashlib.md5(fh.read()).hexdigest()
    except OSError:
        return None


def main():
    dry = '--dry-run' in sys.argv

    # Who owns each file, by content. A file appearing under two products is
    # ambiguous; a file appearing under exactly one belongs to that one.
    # Only the CHOSEN source counts. Every one of these files is a *candidate* of
    # several products, so "is it a candidate elsewhere" flags nothing -- but the
    # Smart Remote's photo is the Smart Remote's HERO, and that is what makes it
    # the Smart Remote's picture rather than DualTech's.
    heroes = {}
    for cat, slug, _name, cands in tiles.catalogue():
        chosen = tiles.forced_source(cands) or (cands[0] if cands else None)
        h = md5(chosen) if chosen else None
        if h:
            heroes.setdefault(h, set()).add(slug)

    src = open('src/catalogue-scraped.ts').read()
    blocks = list(re.finditer(
        r'(\n  \{\n    slug: "([^"]+)",\n    name: "([^"]+)",\n    category: "([^"]+)",)(.*?)(\n  \},)',
        src, re.S))

    kept_total = dropped_total = 0
    drops = {}
    out = src
    for m in reversed(blocks):                       # reverse so offsets stay valid
        slug, body = m.group(2), m.group(5)
        img = re.search(r'imageUrl: "([^"]+)"', body)
        hero = img.group(1) if img else None
        arr = re.search(r'images: \[(.*?)\n    \],', body, re.S)
        if not arr:
            continue
        entries = re.findall(r'\{ src: "([^"]+)"[^}]*\}', arr.group(1))
        keep, dropped = [], []
        for e in entries:
            why = None
            if CATEGORY_BANNER.search(e):
                why = 'category banner'
            elif DIAGRAM.search(os.path.basename(e)):
                why = 'wiring diagram'
            else:
                h = md5('public' + e)
                others = (heroes.get(h) or set()) - {slug}
                if others:
                    why = "is " + ', '.join(sorted(others)) + "'s own hero"
                elif hero and e == hero and len(entries) > 1:
                    why = 'is the hero'
            if why:
                dropped.append((e, why))
            else:
                keep.append(e)

        if dropped:
            drops[f'{slug}'] = dropped
            dropped_total += len(dropped)
        kept_total += len(keep)

        new = 'images: [\n' + ''.join(
            '      { src: "%s", fit: "contain", alt: "%s" },\n' % (e, os.path.basename(e))
            for e in keep) + '    ],'
        out = out[:m.start(5)] + re.sub(r'images: \[.*?\n    \],', new, body, count=1, flags=re.S) + out[m.end(5):]

    print(f'{len(blocks)} products   keeping {kept_total} images, dropping {dropped_total}\n')
    print('=== what is being dropped, and why ===')
    for slug, items in list(drops.items())[:14]:
        for e, why in items[:3]:
            print(f'   {slug:28} {os.path.basename(e)[:38]:40} {why}')
    if len(drops) > 14:
        print(f'   ... and {len(drops) - 14} more products')

    if dry:
        print('\n(dry run -- nothing written)')
        return
    open('src/catalogue-scraped.ts', 'w').write(out)
    print('\nwritten.')


CATEGORY_BANNER = re.compile(r'/product-images/categories/')

if __name__ == '__main__':
    main()
