#!/usr/bin/env python3
"""Build the product -> IES photometry map used by the product pages.

Why this exists
───────────────
`server/files/ies/` holds 515 LM-63 files, but a filename alone does not say
which catalogue product a file belongs to. Product slugs (`sauron`, `raptor`)
and IES filenames (`lumenx-3000k-10w-sauron-downlight.ies`) only agree for a
handful of ranges, and the in-file fields are no help either: across the 107
catalogue products there are ZERO exact matches for any `[LUMCAT]` or
`[LUMINAIRE]` value, and `[INPUTWATTS]` is absent from every LumenX-branded
file, so wattage cannot be matched on.

The supplier's own folder tree is the missing signal. In the client's IES
delivery (`docs/fromKaylen/IES Files/Pioled/`) the files are grouped into
product-family folders that mirror the product list:

    Pioled/UFO High Bays/Raptor UFO Highbay/*.IES   -> Raptor
    Pioled/UFO High Bays/Samurai Highbay/*.IES      -> Samurai
    Pioled/Delta Linear Highbay/IES File/*.IES      -> Delta
    Pioled/Floodlights/Voltron/*.IES                -> Flood

The files were imported into the repo with a slugified name, so each supplier
file maps onto exactly one `server/files/ies/lumenx-*.ies` file:

    PioLED_3000K 10W Sauron Downlight.IES
      -> lumenx-3000k-10w-sauron-downlight.ies

This script walks that tree, resolves each file to its repo counterpart, and
emits a SEED FILE for the database:

    db/seeds/ies-product-map.json

That file is loaded into the `ies_product_files` table with

    node server/scripts/import-ies-product-map.js db/seeds/ies-product-map.json

and `src/ies-product-map.ts` is then rendered from the table by

    npm run ies:map

Do NOT write the TypeScript map from here. The database is the source of truth
(that is what the admin "IES files" tab writes to), and two programs writing the
same generated file is how the map and the database drift apart.

    python3 scripts/build-ies-product-map.py            # write the seed JSON
    python3 scripts/build-ies-product-map.py --report   # coverage only
    python3 scripts/build-ies-product-map.py --out /tmp/ies-seed.json

`docs/fromKaylen/` is gitignored (405 MB of supplier material). This script
reads it but never copies it into the repo — only the resulting filename map
is committed, and it contains no supplier paths.
"""
import argparse
import collections
import glob
import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPPLIER_ROOT = os.path.join(REPO_ROOT, 'docs', 'fromKaylen', 'IES Files', 'Pioled')
IES_DIR = os.path.join(REPO_ROOT, 'server', 'files', 'ies')
OUT_PATH = os.path.join(REPO_ROOT, 'db', 'seeds', 'ies-product-map.json')


# Supplier subfolder -> the catalogue product it supplies photometry for.
# A product may draw on several subfolders; a subfolder maps to one product.
PRODUCT_RULES = [
    ('raptor', [('UFO High Bays', 'Raptor UFO Highbay'),
                ('UFO High Bays', 'Raptor UFO Highbay - 180 LM PER WATT BATCH 2512')]),
    ('samurai', [('UFO High Bays', 'Samurai Highbay')]),
    ('helios', [('UFO High Bays', 'Helios UFO')]),
    ('hornet', [('UFO High Bays', 'Hornet UFO Highbay')]),
    ('arena', [('UFO High Bays', 'Arena UFO Highbay')]),
    ('delta', [('Delta Linear Highbay', 'IES File')]),
    ('gu10-downlight', [('GU10', 'IES File')]),
    ('kuda', [('KUDA', 'IES File')]),
    ('legend', [('Legend', 'IES File')]),
    ('sauron', [('Sauron', '(loose)')]),
    ('soniq', [('Soniq', 'IES File'), ('Soniq', 'Special Order Soniq')]),
    ('lynx', [('Lynx Linear', 'IES File')]),
    ('oarca', [('Oarca', 'IES File')]),
    ('veris', [('Panels', 'Square Panels'), ('Panels', 'Round Panels'), ('Panels', 'IRIS')]),
    ('flood', [('Floodlights', 'Voltron'),
               ('Floodlights', 'Heavy Duty Floods'),
               ('Floodlights', 'Troi IP65 Floodlights'),
               ('Floodlights', 'Thor Coastal LED Floods'),
               ('Floodlights', 'Nano Floods'),
               ('Floodlights', 'Patrol V2 Floodlights'),
               ('Floodlights', 'Oober'),
               ('Floodlights', 'Nano Evo (Don\'t Send Yet)')]),
]

# Files that the folder tree cannot place, matched on the repo filename itself.
# Each entry is (product slug, substring of the repo filename).
FILENAME_RULES = [
    ('raptor', 'ufo-hbay'),
    ('raptor', 'ufo-highbay'),
    ('raptor', '60d-200w-ufo'),
    ('samurai', 'samurai'),
    ('delta', 'h-bay-fl-delta'),
    ('delta', 'lhb05'),
    ('gu10-downlight', 'gu10'),
    ('legend', 'legend'),
    ('veris', 'veris'),
    # The Veris range covers the standard panel sizes; these two panel files
    # arrived outside the supplier's Panels folder.
    ('veris', '1200x300-led-panel'),
    ('veris', 'theia-r'),
    ('diffused-downlight', 'aegeon'),
    ('thermisto', 'themisto'),
    ('thermisto', 'themisto-lensed'),
    # High-bay files that arrived loose rather than in a family folder. Umgeni
    # is the linear highbay in the 150-210W band, matching these wattages.
    ('umgeni', 'hd-high-bay'),
    # Deliberately NOT mapped: `lumenx-ies-file-of-400w-hbay-floodlight.ies`.
    # Its name mixes "hbay" and "floodlight" and no product matches 400W, so
    # assigning it would be a guess. Confirm which range it belongs to.
    # Loose flood files: the Flood range covers the premium/emergency flood
    # bodies.
    ('flood', 'premium-floodlight'),
    ('flood', 'booster-emergency'),
    # Oarca is the 2ft/4ft linear family; the Theia-R panel-sized file arrived
    # in its folder.
    ('oarca', 'oacar'),
]


def repo_slug(filename):
    """Supplier filename -> its imported name in server/files/ies/."""
    stem = re.sub(r'\.ies$', '', filename, flags=re.I)
    stem = re.sub(r'^pioled[_-]?', '', stem, flags=re.I)
    return 'lumenx-' + re.sub(r'[^a-z0-9]+', '-', stem.lower()).strip('-') + '.ies'


def load_repo_files():
    # Case-sensitive on purpose: the real imports are all lowercase `lumenx-`.
    # Matching case-insensitively also swept up the `LumenX_*.ies` seeded
    # samples, which are fabricated and no longer present.
    files = sorted(os.path.basename(p)
                   for p in glob.glob(os.path.join(IES_DIR, '*.ies'))
                   if os.path.basename(p).startswith('lumenx-'))
    return files, set(files)


def walk_supplier_tree():
    """(family, subfolder) -> [repo filenames] for files that exist in the repo."""
    _, repo = load_repo_files()
    groups = collections.defaultdict(list)
    unmatched = []
    for family in sorted(os.listdir(SUPPLIER_ROOT)):
        directory = os.path.join(SUPPLIER_ROOT, family)
        if not os.path.isdir(directory):
            continue
        for path in glob.glob(os.path.join(directory, '**', '*'), recursive=True):
            if not path.lower().endswith('.ies'):
                continue
            rel = os.path.relpath(path, directory)
            parts = rel.split(os.sep)
            sub = parts[0] if len(parts) > 1 else '(loose)'
            candidate = repo_slug(os.path.basename(path))
            if candidate in repo:
                groups[(family, sub)].append(candidate)
            else:
                unmatched.append(os.path.basename(path))
    return groups, unmatched


def strip_redundant_copies(files):
    """Drop `-copy` files that are byte-identical to the file they duplicate.

    The supplier delivered a few files twice (`... Sauron Downlight.IES` and
    `... Sauron Downlight - Copy.IES`, `PioLED_Raptor_...` and a `- Copy`
    sibling). Both imported, and every pair is byte-identical, so listing both
    offers the same photometry twice under two labels.
    """
    keep = []
    for filename in files:
        if '-copy.ies' in filename:
            twin_name = filename.replace('-copy.ies', '.ies')
            twin = os.path.join(IES_DIR, twin_name)
            if os.path.exists(twin):
                with open(twin, 'rb') as a, open(os.path.join(IES_DIR, filename), 'rb') as b:
                    if a.read() == b.read():
                        continue
        keep.append(filename)
    return keep


def build_map():
    groups, unmatched = walk_supplier_tree()
    mapping = collections.OrderedDict()
    for slug, keys in PRODUCT_RULES:
        files = []
        for key in keys:
            files.extend(groups.get(key, []))
        if files:
            mapping[slug] = strip_redundant_copies(sorted(set(files)))

    # Residual pass: place anything the tree missed by inspecting its own name.
    placed = {f for files in mapping.values() for f in files}
    repo_files, repo = load_repo_files()
    for filename in repo_files:
        if filename in placed:
            continue
        low = filename.lower()
        for slug, needle in FILENAME_RULES:
            if needle in low:
                mapping.setdefault(slug, [])
                if filename not in mapping[slug]:
                    mapping[slug].append(filename)
                placed.add(filename)
                break

    for slug in mapping:
        mapping[slug] = strip_redundant_copies(sorted(set(mapping[slug])))

    # A supplier file can sit in two folders (and the odd file is misfiled —
    # the Oarca folder carries a UFO highbay name). Import flattened the tree,
    # so both copies became ONE repo file and it would otherwise be listed
    # under two products. Assign it to the first product that claims it.
    owner = {}
    collisions = []
    for slug in list(mapping):
        kept = []
        for filename in mapping[slug]:
            if filename in owner:
                collisions.append((filename, owner[filename], slug))
                continue
            owner[filename] = slug
            kept.append(filename)
        if kept:
            mapping[slug] = kept
        else:
            del mapping[slug]

    claimed = {f for files in mapping.values() for f in files}
    return mapping, sorted(repo - claimed), unmatched, collisions


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--report', action='store_true',
                        help='print coverage without writing the seed file')
    parser.add_argument('--out', default=OUT_PATH,
                        help='seed JSON path (default: db/seeds/ies-product-map.json)')
    args = parser.parse_args()

    if not os.path.isdir(SUPPLIER_ROOT):
        sys.exit(f'Supplier IES tree not found: {SUPPLIER_ROOT}\n'
                 'docs/fromKaylen/ is gitignored and only present on the machine '
                 'that holds the client delivery.')

    mapping, unclaimed, unmatched, collisions = build_map()
    total = sum(len(v) for v in mapping.values())

    # Copies dropped as byte-identical twins are not "unclaimed" — they were
    # deliberately left out, so report them apart from the real gaps.
    copies = [f for f in unclaimed if '-copy.ies' in f]
    gaps = [f for f in unclaimed if '-copy.ies' not in f]

    print(f'products with photometry : {len(mapping)}')
    print(f'IES files mapped         : {total}')
    print(f'redundant copies dropped : {len(copies)}')
    print(f'IES files with no product: {len(gaps)}')
    print(f'supplier files not in repo: {len(unmatched)}')
    for slug, files in mapping.items():
        print(f'  {slug:34s} {len(files):3d}')

    if gaps:
        print('\nno product identified for:')
        for filename in gaps:
            print(f'  {filename}')

    if collisions:
        print(f'\nfiles claimed by two products ({len(collisions)}) — '
              'assigned to the first, listed for review:')
        for filename, kept_by, dropped_from in collisions:
            print(f'  {filename}\n    kept under {kept_by!r}, removed from {dropped_from!r}')

    if args.report:
        return

    seed = {
        '_comment': ('Supplier-tree export for the ies_product_files table. '
                     'Load with: node server/scripts/import-ies-product-map.js '
                     'db/seeds/ies-product-map.json — then run npm run ies:map.'),
        'generated_by': 'scripts/build-ies-product-map.py',
        'products': len(mapping),
        'files': total,
        'map': mapping,
    }

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w') as handle:
        json.dump(seed, handle, indent=2, sort_keys=True)
        handle.write('\n')
    print(f'\nwrote {os.path.relpath(out_path, REPO_ROOT)}')
    print('next: node server/scripts/import-ies-product-map.js '
          f'{os.path.relpath(out_path, REPO_ROOT)} && npm run ies:map')



if __name__ == '__main__':
    main()
