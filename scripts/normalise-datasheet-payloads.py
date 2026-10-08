#!/usr/bin/env python3
"""Tidy the datasheet payloads so the rendered sheets do not repeat themselves.

Three things are wrong with the payloads as generated, all visible on the sheet:

  * the spec columns carry a section literally named "Specifications", so every
    sheet ends with a heading that means nothing next to PHYSICAL and
    ELECTRICAL — and it is split across both columns, so it appears twice;
  * rows repeat under near-synonym labels: "Lumens" and "Lumen Output" both
    showing 3500 lm, "Power" and "Wattage" both showing 35 W;
  * the stat chips do the same, giving two identical chips side by side.

This merges the two Specifications sections into one, folds their rows into the
column that already holds the real electrical and product data, and drops rows
and chips that repeat a label they have already used.

Idempotent: running it twice changes nothing the second time.

    python3 scripts/normalise-datasheet-payloads.py [--check] [slug ...]
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'server', 'datasheets-data')

# Labels that mean the same thing, so a row repeated under two names is shown
# once. Mirrors SPEC_SYNONYMS in src/catalogue-full.ts — the website and the
# sheet should agree about what counts as a duplicate.
SPEC_SYNONYMS = {
    'lumen output': 'lumens',
    'luminous flux': 'lumens',
    'wattage': 'power',
    'nominal wattage': 'power',
    'rated wattage': 'power',
    'colour temperature': 'colour temperature',
    'correlated colour temperature': 'colour temperature',
    'european article number (ean)': 'ean',
    'pu1, ean': 'ean',
    'product category': 'type',
    'lamp colour': 'colour',
    'reach, radial': 'reach, tangential',
}

# The heading that carries no information and is duplicated across the columns.
GENERIC_TITLE = 'specifications'


def canonical(label):
    key = re.sub(r'\s+', ' ', str(label or '').lower()).strip()
    return SPEC_SYNONYMS.get(key, key)


def canonical_value(value):
    """Compare values as a reader would.

    The payloads write thousands inconsistently — "3500 lm" here, "3 500 lm"
    there — so a plain string compare leaves "Lumens" and "Lumen Output" sitting
    side by side with what is obviously the same number.
    """
    text = str(value or '').lower().strip()
    text = re.sub(r'(?<=\d)[\s,\u00a0](?=\d)', '', text)   # 3 500 -> 3500
    text = re.sub(r'\s+', ' ', text)
    return text


def dedupe_rows(rows):
    seen = set()
    out = []
    for row in rows:
        key = f"{canonical(row.get('label'))}|{canonical_value(row.get('value'))}"
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def dedupe_stats(stats):
    seen = set()
    out = []
    for stat in stats:
        key = (f"{canonical(stat.get('label'))}|"
               f"{canonical_value(stat.get('value'))}|{stat.get('unit', '')}")
        if key in seen:
            continue
        seen.add(key)
        out.append(stat)
    return out


def normalise(payload):
    """Tidy one payload without changing its shape.

    Rows are split across the two columns on purpose — the detector payloads
    carry nearly fifty specifications and they do not fit in one column — so the
    split is left alone. What is fixed is the duplication: the same spec listed
    twice under near-synonym labels, and both columns' catch-all section carrying
    the same meaningless "Specifications" title.
    """
    columns = payload.get('columns') or {}
    left = list(columns.get('left') or [])
    right = list(columns.get('right') or [])

    # A row dropped from the left column must not reappear on the right.
    seen = set()

    def tidy(sections, generic_title):
        out = []
        for section in sections:
            rows = []
            for row in section.get('rows') or []:
                key = (f"{canonical(row.get('label'))}|"
                       f"{canonical_value(row.get('value'))}")
                if key in seen:
                    continue
                seen.add(key)
                rows.append(row)
            if not rows:
                continue
            title = section.get('title')
            if str(title or '').strip().lower() == GENERIC_TITLE and generic_title:
                title = generic_title
            out.append({'title': title, 'rows': rows})
        return out

    left = tidy(left, 'Technical Data')
    right = tidy(right, 'Product Information')

    payload['columns'] = {'left': left, 'right': right}
    payload['stats'] = dedupe_stats(payload.get('stats') or [])
    return payload


def cutout_for_payload():
    """Map each payload stem to the product cut-out that should head its sheet.

    The payloads are named after the supplier's own stem (`ledsc4-eko-10141`),
    while the cut-outs are named after the product (`eko`), so the link has to
    come from the catalogue: every scraped record carries the stem it renders
    from, and the cut-out lives under the product's category and slug.
    """
    src = open(os.path.join(ROOT, 'src', 'catalogue-scraped.ts')).read()
    mapping = {}
    pattern = re.compile(
        r'\n  \{\n    slug: "([^"]+)",\n    name: "[^"]+",\n    category: "([^"]+)",'
        r'(.*?)\n  \},', re.S)
    for match in pattern.finditer(src):
        slug, category, body = match.groups()
        stem = re.search(r'pdfUrl: "/api/download/datasheet/generated/([^"]+)"', body)
        if not stem:
            continue
        cut = os.path.join('public', 'product-images', 'cutouts', category, f'{slug}.png')
        if os.path.exists(os.path.join(ROOT, cut)):
            mapping[stem.group(1)] = '../' + cut
    return mapping


def apply_heroes(payload, src):
    """Point the sheet's hero at the cut-out rather than the raw supplier photo.

    Cut-outs are transparent, so they sit on the white sheet with no visible
    frame; the scraped originals are white-background JPEGs and leave a hard
    rectangle around the product.
    """
    if not src:
        return payload
    hero = payload.get('heroImage') or {}
    hero['src'] = src
    payload['heroImage'] = hero
    return payload


def main():
    check = '--check' in sys.argv
    named = [a for a in sys.argv[1:] if not a.startswith('--')]
    files = sorted(glob.glob(os.path.join(DATA, '*.json')))
    if named:
        files = [f for f in files if os.path.basename(f)[:-5] in named]

    heroes = cutout_for_payload()
    if not check:
        print(f'  cut-outs available for {len(heroes)} payloads')

    changed = 0
    for path in files:
        with open(path) as fh:
            original = json.load(fh)
        stem = os.path.basename(path)[:-5]
        updated = normalise(json.loads(json.dumps(original)))
        updated = apply_heroes(updated, heroes.get(stem))
        if updated == original:
            continue
        changed += 1
        if not check:
            with open(path, 'w') as fh:
                json.dump(updated, fh, indent=2, ensure_ascii=False)
                fh.write('\n')

    verb = 'would change' if check else 'normalised'
    print(f'  {verb} {changed} of {len(files)} payloads')


if __name__ == '__main__':
    main()
