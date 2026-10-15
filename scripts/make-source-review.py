#!/usr/bin/env python3
"""Build the source-image review pack: one contact sheet per category.

This is the review that reads INPUTS rather than outputs. Every fault found in
this catalogue so far was an input problem — a mislabelled file, a 502x240
source, a supplier composite — so the sheet shows the raw candidate images
rather than the rendered tiles, with the candidate the pipeline currently picks
marked in cyan.

Each row is one product:

    name / slug            [CARD] [cand 1] [cand 2] [cand 3] ...

* CARD is the tile that fronts the product on the site today.
* The cyan-bordered cell is the candidate make-product-tiles.py selects.
* Captions carry the file name, its pixel size and its score, plus any flag the
  scorer already knows about (no uniform backdrop, tiny, past the candidate cap).

Wrapped rows repeat the product label so a continuation is never ambiguous.

    python3 scripts/make-source-review.py [output-dir]

Writes <category>-<page>.png plus duplicates.txt (files that hold byte-identical
content — the shape the three mislabelled Steinel files took).
"""
import hashlib
import importlib.util
import os
import sys
from collections import defaultdict

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(os.path.expanduser('~'), 'Documents', 'catalogue-review', 'sources')

# layout
LABEL_W = 300
CELL = 190          # image cell, square
PAD = 8
ROW_H = 224
COLS = 6            # candidate cells per row before wrapping
MAX_ROWS = 8        # rows per sheet before paginating

BG = (16, 16, 20)
ROW_BG = (24, 24, 30)
ROW_BG_ALT = (30, 30, 38)
INK = (232, 232, 236)
DIM = (150, 150, 158)
ACCENT = (0, 212, 255)
WARN = (255, 176, 60)
BAD = (255, 110, 110)
OK = (120, 230, 150)
STAGE = (242, 242, 244)

_spec = importlib.util.spec_from_file_location(
    'tiles', os.path.join(ROOT, 'scripts', 'make-product-tiles.py'))
tiles = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tiles)

_cspec = importlib.util.spec_from_file_location(
    'cutouts', os.path.join(ROOT, 'scripts', 'make-cutouts.py'))
cutouts = importlib.util.module_from_spec(_cspec)
_cspec.loader.exec_module(cutouts)


def font(size, bold=False):
    names = ('Arial Bold.ttf', 'Arial.ttf') if bold else ('Arial.ttf', 'Helvetica.ttc')
    for name in names:
        try:
            return ImageFont.truetype(f'/System/Library/Fonts/Supplemental/{name}', size)
        except Exception:                                 # noqa: BLE001
            continue
    return ImageFont.load_default()


def catalogue():
    items = tiles.products()
    items += [p for p in tiles.official_products()
              if not any(p[0] == q[0] and p[1] == q[1] for q in items)]
    return items


def digest(path):
    h = hashlib.md5()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def fit(im, box, bg=STAGE):
    """Letterbox onto a light stage, the way the product page shows a source."""
    im = im.convert('RGB')
    r = min(box / im.width, box / im.height)
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    out = Image.new('RGB', (box, box), bg)
    out.paste(im, ((box - im.width) // 2, (box - im.height) // 2))
    return out


def build(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    items = catalogue()

    # byte-identical sources across the whole catalogue: the mislabel signature
    where = defaultdict(list)
    for cat, slug, name, cands in items:
        for p in cands:
            if os.path.exists(p):
                where[digest(p)].append(f'{cat}/{slug}')

    f_name = font(15, True)
    f_slug = font(12)
    f_cap = font(11)
    f_capb = font(11, True)
    f_head = font(22, True)
    f_sub = font(13)

    by_cat = defaultdict(list)
    for it in items:
        by_cat[it[0]].append(it)

    pages_out = []
    for cat in sorted(by_cat):
        rows = []            # (label_lines, cells)
        for c, slug, name, cands in by_cat[cat]:
            chosen = cutouts.chosen_source(cands)
            cells = []
            tile = os.path.join(ROOT, 'public', 'product-images', 'tiles', cat, f'{slug}.jpg')
            cells.append({'kind': 'card', 'path': tile if os.path.exists(tile) else None,
                          'cap': 'CARD (live)', 'note': '', 'state': 'card'})
            for i, p in enumerate(cands):
                if not os.path.exists(p):
                    cells.append({'kind': 'missing', 'path': None, 'cap': os.path.basename(p)[:26],
                                  'note': 'MISSING', 'state': 'bad'})
                    continue
                info = tiles.score_candidate(p)
                with Image.open(p) as im:
                    w, h = im.size
                notes = []
                state = 'plain'
                if p == chosen:
                    state = 'chosen'
                if info is None:
                    state = 'bad'
                    notes.append('rejected')
                else:
                    s, strict = info
                    notes.append(f'{s:.0f}')
                    if not strict:
                        notes.append('no clean cut-out')
                if i >= tiles.MAX_CANDIDATES:
                    notes.append('past cap')
                if w < 200 or h < 200:
                    notes.append('TINY')
                    state = 'warn' if state == 'plain' else state
                dup = where[digest(p)]
                if len(dup) > 1:
                    others = [d for d in dup if d != f'{cat}/{slug}']
                    notes.append('= ' + others[0] if others else '= dup')
                    state = 'warn' if state == 'plain' else state
                cells.append({'kind': 'src', 'path': p, 'cap': os.path.basename(p)[:26],
                              'note': f'{w}x{h}  ' + '  '.join(notes), 'state': state})

            # wrap into physical rows of COLS cells
            first = True
            for start in range(0, len(cells), COLS):
                chunk = cells[start:start + COLS]
                rows.append((c, slug, name, chunk, first))
                first = False

        for page in range(0, len(rows), MAX_ROWS):
            chunk = rows[page:page + MAX_ROWS]
            width = LABEL_W + COLS * (CELL + PAD) + PAD + 16
            height = 78 + len(chunk) * ROW_H + PAD
            sheet = Image.new('RGB', (width, height), BG)
            d = ImageDraw.Draw(sheet)
            title = cat.replace('-', ' ').title()
            d.text((PAD + 4, 16), title, fill=INK, font=f_head)
            d.text((PAD + 4, 48),
                   f'{len(by_cat[cat])} products   ·   page {page // MAX_ROWS + 1}   ·   '
                   f'cyan = candidate in use', fill=DIM, font=f_sub)

            for i, (c, slug, name, cells, first) in enumerate(chunk):
                y = 78 + i * ROW_H
                d.rectangle([0, y, width, y + ROW_H - PAD],
                            fill=ROW_BG if i % 2 == 0 else ROW_BG_ALT)
                if first:
                    d.text((PAD + 4, y + 12), name[:33], fill=INK, font=f_name)
                    d.text((PAD + 4, y + 34), f'{slug}'[:34], fill=DIM, font=f_slug)
                    d.text((PAD + 4, y + 52), c, fill=DIM, font=f_slug)
                else:
                    d.text((PAD + 4, y + 12), '(continued)', fill=DIM, font=f_slug)
                    d.text((PAD + 4, y + 32), name[:33], fill=DIM, font=f_slug)

                for k, cell in enumerate(cells):
                    x = LABEL_W + k * (CELL + PAD)
                    if cell['path'] is None:
                        d.rectangle([x, y + 6, x + CELL, y + 6 + CELL], fill=(52, 22, 22))
                        d.text((x + 8, y + 6 + CELL // 2), cell['note'] or 'MISSING',
                               fill=BAD, font=f_capb)
                    else:
                        with Image.open(cell['path']) as im:
                            sheet.paste(fit(im, CELL), (x, y + 6))
                    border = {'chosen': ACCENT, 'warn': WARN, 'bad': BAD,
                              'card': (90, 200, 255), 'plain': (70, 70, 82)}[cell['state']]
                    wdt = 3 if cell['state'] in ('chosen', 'card') else 1
                    d.rectangle([x - 1, y + 5, x + CELL, y + 6 + CELL], outline=border, width=wdt)
                    if cell['state'] == 'chosen':
                        d.text((x + 4, y + 9), 'IN USE', fill=(6, 30, 38), font=f_capb)
                    elif cell['state'] == 'card':
                        d.text((x + 4, y + 9), 'CARD', fill=(6, 30, 38), font=f_capb)
                    cap_col = {'chosen': ACCENT, 'card': (150, 220, 255)}.get(cell['state'], DIM)
                    d.text((x, y + 6 + CELL + 4), cell['cap'], fill=cap_col, font=f_cap)
                    if cell['note']:
                        col = WARN if cell['state'] == 'warn' else (
                            BAD if cell['state'] == 'bad' else DIM)
                        d.text((x, y + 6 + CELL + 18), cell['note'][:34], fill=col, font=f_cap)

            path = os.path.join(out_dir, f'{cat}-{page // MAX_ROWS + 1}.png')
            sheet.save(path)
            pages_out.append(path)

    # duplicate report
    lines = []
    for h, users in sorted(where.items(), key=lambda kv: -len(kv[1])):
        if len(users) > 1:
            lines.append(f'{h[:12]}  {len(users)} products share this file:')
            for u in users:
                lines.append(f'    {u}')
    with open(os.path.join(out_dir, 'duplicates.txt'), 'w') as fh:
        fh.write('\n'.join(lines) + '\n' if lines else 'no duplicate source files\n')

    return pages_out, len(items), sum(len(c[3]) for c in items), len(lines)


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    pages, n_prod, n_src, n_dup = build(out_dir)
    print(f'  {n_prod} products, {n_src} declared source slots')
    print(f'  {len(pages)} sheets written to {out_dir}')
    print(f'  {n_dup} duplicate-group lines in duplicates.txt')


if __name__ == '__main__':
    main()
