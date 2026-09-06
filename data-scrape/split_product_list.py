#!/usr/bin/env python3
"""Rebuild data-scrape/product-lists/*.csv from resources/LumenxProductList.csv
(the Numbers workbook export), then parse them into master_products.json.

The merged CSV stores each Numbers sheet as: <sheet title row>, <header row>, <rows>.
Sections that were separate sheets keep their original file names.
"""
import csv, json, os, sys

RES = os.path.expanduser(
    '~/Documents/lumenx-lighting/resources/LumenxProductList.csv')
DATA_ROOT = os.path.dirname(os.path.abspath(__file__))
LISTDIR = os.path.join(DATA_ROOT, 'product-lists')

# title -> original product-lists filename ('' merges into previous sheet block)
FILEMAP = [
    ('Downlights', 'Downlights-Table 1.csv'),
    ('Track', 'Track-Table 1.csv'),
    ('Vapour proof', 'VPs-Table 1.csv'),
    ('Linears', 'Linears-Table 1.csv'),
    ('Panels', 'Panels-Table 1.csv'),
    ('Highbays', 'Highbays-Table 1.csv'),
    ('Bulkheads', 'Bulkheads-Table 1.csv'),
    ('Floods', 'Floods-Table 1.csv'),
    ('Strips', 'Strips-Table 1.csv'),
    ('Profiles???', None),  # subsection inside Strips sheet
    ('Solar', 'Solar-Table 1.csv'),
    ('Sensors', 'Lighting Control-Table 1.csv'),
    ('Indoor Decorative', 'Indoor Decorative -Table 1.csv'),
    ('Indoor Architectural', 'Indoor Architectural-Table 1.csv'),
    ('Outdoor Architectural', 'Outdoor Architectural-Table 1.csv'),  # LEDsC4 block
    ('Outdoor Architectural', 'Outdoor-Table 1.csv'),                # Pioled/Superlume block
]


def is_title_row(cells):
    return bool(cells) and bool(cells[0].strip()) and not any(cells[1:])


def main():
    with open(RES, newline='', encoding='utf-8-sig') as fh:
        raw = list(csv.reader(fh, delimiter=';'))
    # split into blocks by title rows; header row follows title
    blocks = []  # (title, [lines])
    cur_title, cur_lines = None, []
    for r in raw:
        cells = [(c or '').strip() for c in r]
        if is_title_row(cells) and not (cur_lines and cur_lines[-1][:1] == [[]]):  # blank sep already handled below
            if cur_title is not None:
                blocks.append((cur_title, cur_lines))
            cur_title, cur_lines = cells[0], [r]
        else:
            if cur_title is None:
                continue
            cur_lines.append(r)
    if cur_title is not None:
        blocks.append((cur_title, cur_lines))

    # merge 'Profiles???' back into the Strips sheet (its rows stay in that block)
    merged = []
    for title, lines in blocks:
        if title == 'Profiles???' and merged:
            merged[-1] = (merged[-1][0], merged[-1][1] + lines)
        else:
            merged.append((title, lines))

    # block order after merging == order of FILEMAP minus None entries
    names = [f for _, f in FILEMAP if f]
    if len(merged) != len(names):
        print('! block/file count mismatch', len(merged), len(names))
        return
    used_names = set()
    for (title, lines), name in zip(merged, names):
        if name in used_names:
            n = 2
            cand = name.replace('.csv', f'-{n}.csv')
            while cand in used_names:
                n += 1
                cand = name.replace('.csv', f'-{n}.csv')
            name = cand
        used_names.add(name)
        with open(os.path.join(LISTDIR, name), 'w', newline='', encoding='utf-8') as fh:
            w = csv.writer(fh, delimiter=';', lineterminator='\n')
            for r in lines:
                w.writerow(r)
        print('wrote', name, f'({len(lines)} lines)')
    print('total blocks', len(merged))


if __name__ == '__main__':
    main()
